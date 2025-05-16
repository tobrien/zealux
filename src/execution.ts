import * as Process from './process';
import * as Phase from './phase';
import { validateProcess } from './validator';

export interface ExecutionResults {
    [nodeId: string]: Phase.Output;
}

interface ExecutionError {
    nodeId: string;
    error: any;
}

// Helper type for internal state management
interface ExecutionState {
    process: Process.Instance;
    phaseResults: Map<string, Phase.Output>;
    activeExecutions: Map<string, Promise<Phase.Output>>;
    errors: ExecutionError[];
}



async function executeNodeRecursive(
    nodeId: string,
    input: Phase.Input,
    state: ExecutionState
): Promise<Phase.Output> {
    // 1. Check if result is already cached
    if (state.phaseResults.has(nodeId)) {
        return state.phaseResults.get(nodeId)!;
    }

    // 2. Check if this node is already being actively executed
    if (state.activeExecutions.has(nodeId)) {
        return state.activeExecutions.get(nodeId)!;
    }

    const node = state.process.phases[nodeId];
    if (!node) {
        const error = new Error(`PhaseNode with ID "${nodeId}" not found.`);
        state.errors.push({ nodeId, error });
        throw error;
    }

    // 3. Mark as active and execute
    const executionPromise = (async () => {
        try {
            const output = await node.phase.execute(input);
            state.phaseResults.set(nodeId, output); // Cache the result

            // 4. Trigger next phases (fan-out)
            if (node.next && node.next.length > 0) {
                const nextPhasePromises: Promise<Phase.Output>[] = [];
                for (const connection of node.next) {
                    let nextInput = output as Phase.Input;
                    let nextContext = state.process.context;
                    if (connection.transform) {
                        try {
                            const context = state.process.context;
                            [nextInput, nextContext] = connection.transform(output, context);
                            state.process.context = nextContext;
                        } catch (transformError) {
                            // eslint-disable-next-line no-console
                            console.error(`Error in transform for connection ${nodeId} -> ${connection.targetPhaseNodeId}:`, transformError);
                            state.errors.push({ nodeId: connection.targetPhaseNodeId, error: transformError });
                            continue;
                        }
                    }
                    nextPhasePromises.push(executeNodeRecursive(connection.targetPhaseNodeId, nextInput, state));
                }
                // Optional: await Promise.all(nextPhasePromises);
            } else {
                // If there are no next phases, we need to end the process
                state.process.end(output);
            }
            return output;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Error executing phase ${nodeId}:`, error);
            state.errors.push({ nodeId, error });
            throw error;
        } finally {
            state.activeExecutions.delete(nodeId); // Clean up
        }
    })();

    state.activeExecutions.set(nodeId, executionPromise);
    return executionPromise;
}

function gatherResults(state: ExecutionState): ExecutionResults {
    const results: ExecutionResults = {};
    let hasExplicitEndPhases = false;
    for (const nodeId in state.process.phases) {
        if (state.process.phases[nodeId].isEndPhase) {
            hasExplicitEndPhases = true;
            if (state.phaseResults.has(nodeId)) {
                results[nodeId] = state.phaseResults.get(nodeId)!;
            } else if (!state.errors.find(e => e.nodeId === nodeId)) {
                // eslint-disable-next-line no-console
                console.warn(`End phase "${nodeId}" did not execute or produce a result.`);
            }
        }
    }

    if (!hasExplicitEndPhases) {
        for (const nodeId in state.process.phases) {
            const node = state.process.phases[nodeId];
            const hasExecuted = state.phaseResults.has(nodeId);
            const isLeafNode = (!node.next || node.next.length === 0);

            if (hasExecuted && isLeafNode) {
                results[nodeId] = state.phaseResults.get(nodeId)!;
            }
        }
    }

    if (state.errors.length > 0) {
        // eslint-disable-next-line no-console
        console.warn("Process execution completed with errors:", state.errors);
    }

    return results;
}

export async function executeProcess(
    processInstance: Process.Instance,
    initialInput: Phase.Input
): Promise<ExecutionResults> {
    const validationErrors = validateProcess(processInstance);
    if (validationErrors.length > 0) {
        throw new Error(`Invalid process definition:\n${validationErrors.join('\n')}`);
    }

    const state: ExecutionState = {
        process: processInstance,
        phaseResults: new Map<string, Phase.Output>(),
        activeExecutions: new Map<string, Promise<Phase.Output>>(),
        errors: [],
    };

    if (!state.process.phases[state.process.startPhaseId]) {
        throw new Error(`Start phase ID "${state.process.startPhaseId}" not found in process phases.`);
    }

    try {
        await executeNodeRecursive(state.process.startPhaseId, initialInput, state);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Critical error during process execution orchestration:", error);
        // Depending on desired behavior, you might want to re-throw or handle differently
    }

    return gatherResults(state);
}


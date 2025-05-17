import { Process } from './process';
import { validateProcess } from './validator';
import { isConnection, isTermination, Termination } from './phasenode';
import { Output } from './output';
import { Input } from './input';
import { Context } from 'context';

export type PhaseResults = Map<string, Output>;

export type ProcessResults = Map<string, Output>;

interface ExecutionError {
    nodeId: string;
    error: any;
}

// Helper type for internal state management
interface ExecutionState {
    process: Process;
    phaseResults: PhaseResults;
    results: ProcessResults;
    activeExecutions: Map<string, Promise<Output>>;
    errors: ExecutionError[];
}



async function executeNodeRecursive(
    nodeId: string,
    input: Input,
    state: ExecutionState
): Promise<Output> {
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
            if (node.next && Array.isArray(node.next) && node.next.length > 0 && node.next.every(isConnection)) {
                const nextPhasePromises: Promise<Output>[] = [];
                for (const connection of node.next) {
                    let nextInput = output as Input;
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
            } else if (node.next && isTermination(node.next)) {
                const termination = node.next as Termination<Output, Output, Context>;
                const result: Output = output;
                if (termination.terminate) {
                    termination.terminate(output, state.process.context);
                }
                state.results.set(termination.id, result); // Also call the general process end
            } else {
                // If there is no next, consider this is an end state and store the result with the nodeId
                const result: Output = output;
                state.results.set(nodeId, result);
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

export async function executeProcess(
    processInstance: Process,
    initialInput: Input
): Promise<[ProcessResults, PhaseResults, Context]> {
    const validationErrors = validateProcess(processInstance);
    if (validationErrors.length > 0) {
        throw new Error(`Invalid process definition:\n${validationErrors.join('\n')}`);
    }

    const state: ExecutionState = {
        process: processInstance,
        results: new Map<string, Output>(),
        phaseResults: new Map<string, Output>(),
        activeExecutions: new Map<string, Promise<Output>>(),
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

    return [state.results, state.phaseResults, state.process.context];
}


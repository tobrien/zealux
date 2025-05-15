import * as Process from './process';
import * as Phase from './phase';

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

export function validateProcess(process: Process.Instance): string[] {
    const errors: string[] = [];
    if (!process || typeof process !== 'object') {
        errors.push("Process definition is missing or not an object.");
        return errors; // Stop further validation if basic structure is wrong
    }

    if (!process.phases || typeof process.phases !== 'object') {
        errors.push("Process 'phases' collection is missing or not an object.");
    }

    if (typeof process.startPhaseId !== 'string' || !process.startPhaseId) {
        errors.push("Process 'startPhaseId' is missing or invalid.");
    } else if (process.phases && !process.phases[process.startPhaseId]) {
        errors.push(`Start phase ID "${process.startPhaseId}" does not exist in the phases collection.`);
    }

    const phaseIds = process.phases ? Object.keys(process.phases) : [];
    if (phaseIds.length === 0 && process.startPhaseId) {
        errors.push("Process has a startPhaseId but no phases defined.");
    }

    for (const id of phaseIds) {
        const node = process.phases[id];
        if (!node || typeof node !== 'object') {
            errors.push(`PhaseNode definition for ID "${id}" is missing or invalid.`);
            continue;
        }
        if (node.id !== id) {
            errors.push(`PhaseNode ID "${node.id}" does not match its key "${id}" in the phases collection.`);
        }
        if (!node.phase || typeof node.phase.execute !== 'function') {
            errors.push(`PhaseNode "${id}" is missing a valid phase instance with an execute method.`);
        }
        if (!Array.isArray(node.next)) {
            errors.push(`PhaseNode "${id}" has an invalid 'next' property (should be an array).`);
        } else {
            for (const connection of node.next) {
                if (!connection || typeof connection.targetPhaseNodeId !== 'string' || !connection.targetPhaseNodeId) {
                    errors.push(`PhaseNode "${id}" has an invalid connection (targetPhaseNodeId missing or invalid).`);
                } else if (process.phases && !process.phases[connection.targetPhaseNodeId]) {
                    errors.push(`PhaseNode "${id}" has a connection to non-existent targetPhaseNodeId "${connection.targetPhaseNodeId}".`);
                }
                if (connection.transform && typeof connection.transform !== 'function') {
                    errors.push(`PhaseNode "${id}" has a connection to "${connection.targetPhaseNodeId}" with an invalid transform (should be a function).`);
                }
            }
        }
    }

    // Basic reachability check from start node (optional, can be more complex)
    if (process.startPhaseId && process.phases && process.phases[process.startPhaseId]) {
        const visited = new Set<string>();
        const stack: string[] = [process.startPhaseId];
        while (stack.length > 0) {
            const currentId = stack.pop()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);
            const currentNode = process.phases[currentId];
            if (currentNode && currentNode.next) {
                currentNode.next.forEach(conn => {
                    if (process.phases[conn.targetPhaseNodeId] && !visited.has(conn.targetPhaseNodeId)) {
                        stack.push(conn.targetPhaseNodeId);
                    }
                });
            }
        }
    }
    return errors;
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
                    if (connection.transform) {
                        try {
                            nextInput = connection.transform(output);
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


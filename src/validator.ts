import { Connection } from './phasenode';
import { Process } from './process';

export function validateProcess(process: Process): string[] {
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

        // Check if 'next' is an array (for Connections) or an object (for Termination)
        if (node.next === undefined || node.next === null) {
            errors.push(`PhaseNode "${id}" has a missing 'next' property.`);
        } else if (Array.isArray(node.next)) { // It's an array of Connections
            for (const connection of node.next as Connection<any, any, any>[]) { // Cast to Connection array
                if (!connection || typeof connection.targetPhaseNodeId !== 'string' || !connection.targetPhaseNodeId) {
                    errors.push(`PhaseNode "${id}" has an invalid connection (targetPhaseNodeId missing or invalid).`);
                } else if (process.phases && !process.phases[connection.targetPhaseNodeId]) {
                    errors.push(`PhaseNode "${id}" has a connection to non-existent targetPhaseNodeId "${connection.targetPhaseNodeId}".`);
                }
                if (connection.transform && typeof connection.transform !== 'function') {
                    errors.push(`PhaseNode "${id}" has a connection to "${connection.targetPhaseNodeId}" with an invalid transform (should be a function).`);
                }
            }
        } else if (typeof node.next === 'object') { // It could be a Termination object
            const termination = node.next as any; // Use 'any' for now, or import Termination and isTermination
            if (typeof termination.id !== 'string' || typeof termination.terminate !== 'function') {
                errors.push(`PhaseNode "${id}" has an invalid Termination object for 'next'. It must have 'id' (string) and 'terminate' (function) properties.`);
            }
            // Add any other specific validation for Termination objects if needed
        } else {
            // This case should ideally not be reached if types are correct, but as a fallback:
            errors.push(`PhaseNode "${id}" has an invalid 'next' property type. Expected an array of Connections or a Termination object.`);
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
                if (Array.isArray(currentNode.next)) {
                    currentNode.next.forEach((conn: Connection) => {
                        if (process.phases[conn.targetPhaseNodeId] && !visited.has(conn.targetPhaseNodeId)) {
                            stack.push(conn.targetPhaseNodeId);
                        }
                    });
                }
            }
        }
    }
    return errors;
}

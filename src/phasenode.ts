import * as Phase from './phase';
import { isPhase } from './phase';

export interface Connection {
    targetPhaseNodeId: string; // ID of the target PhaseNode in the process's phases collection
    // Optional function to transform the output of the current phase
    // to the input of the target phase.
    // If not provided, the output is assumed to be compatible directly.
    transform?: (output: Phase.Output) => Phase.Input;
}

export interface Instance {
    id: string; // Unique identifier for this phase node within the process
    phase: Phase.Instance; // The actual phase instance
    next: Connection[]; // Renamed from 'outgoingConnections'
    isEndPhase?: boolean; // Optional: true if this is a terminal node in the process graph
}

export const isPhaseNode = (obj: any): obj is Instance => {
    return obj !== undefined && obj !== null && typeof obj === 'object' && typeof obj.id === 'string' && typeof obj.phase === 'object' && isPhase(obj.phase);
}
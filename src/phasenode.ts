import { Context } from './process';
import * as Phase from './phase';
import { isPhase } from './phase';

export interface Connection<O extends Phase.Output = Phase.Output, I extends Phase.Input = Phase.Input, C extends Context = Context> {
    targetPhaseNodeId: string; // ID of the target PhaseNode in the process's phases collection
    // Optional function to transform the output of the current phase
    // to the input of the target phase.
    // If not provided, the output is assumed to be compatible directly.
    transform?: (output: O, context: C) => [I, C];
}

export interface Instance<I extends Phase.Input = Phase.Input, O extends Phase.Output = Phase.Output, C extends Context = Context> {
    id: string; // Unique identifier for this phase node within the process
    phase: Phase.Instance<I, O>; // The actual phase instance
    next: Connection<O, Phase.Input, C>[]; // Renamed from 'outgoingConnections'
    isEndPhase?: boolean; // Optional: true if this is a terminal node in the process graph
}

export const isPhaseNode = (obj: any): obj is Instance => {
    return obj !== undefined && obj !== null && typeof obj === 'object' && typeof obj.id === 'string' && typeof obj.phase === 'object' && isPhase(obj.phase);
}
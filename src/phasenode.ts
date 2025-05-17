import { Input } from './input';
import { Output } from './output';
import { Phase, isPhase } from './phase';
import { Context } from './context';

// MODIFIED: Connection to extend Transition
export interface Connection<
    O extends Output = Output,      // Output of the source phase
    I extends Input = Input,        // Input for the target phase
    C extends Context = Context,
> {
    targetPhaseNodeId: string; // ID of the target PhaseNode in the process's phases collection
    // Optional function to transform the output of the current phase
    // to the input of the target phase.
    // If not provided, the output is assumed to be compatible directly.
    transform?: (output: O, context: C) => [I, C];
}

// NEW: Termination type extending Transition
/**
 * Represents a termination point in the process flow, consuming a phase's output.
 */

export interface Termination<
    O_PH extends Output = Output,      // Output of the phase leading to termination
    O_PR extends Output = Output,
    C extends Context = Context,                // Context at the point of termination
> {
    id: string;
    // Currently, Termination is a marker type.
    // Future properties could include:
    // reason?: string; // To describe why termination occurred
    terminate?: (output: O_PH, context: C) => O_PR; // A function to execute upon termination
}

export interface PhaseNode<
    I extends Input = Input,        // Input to this phase instance
    O extends Output = Output,      // Output from this phase instance
    C extends Context = Context,
    O_PR extends Output = Output,
> {
    id: string; // Unique identifier for this phase node within the process
    phase: Phase<I, O>; // The actual phase instance

    // The next step is either the termination, or an array of connections
    next: Termination<O, O_PR, C> | Connection<O, Input, C>[];
}

export const isPhaseNode = (obj: any): obj is PhaseNode => {
    return obj !== undefined &&
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.phase === 'object' && isPhase(obj.phase) &&
        // Check if next exists and is an object (could be Termination or an array of Connections)
        typeof obj.next === 'object';
};

// Type guards for Connection and Termination

/**
 * Type guard to check if an item is a Connection.
 */
export const isConnection = <
    O extends Output,
    I extends Input,
    C extends Context,
>(item: any): item is Connection<O, I, C> => {
    return item !== null && typeof item === 'object' && (item as Connection<O, I, C>).targetPhaseNodeId !== undefined;
};

/**
 * Type guard to check if an item is a Termination.
 * Assumes that if an item is not a Connection and has a 'terminate' function, it is a Termination.
 * This may need refinement if more Transition subtypes are added or structures change.
 */
export const isTermination = <
    O_PH extends Output,
    O_PR extends Output,
    C extends Context,
>(item: any): item is Termination<O_PH, O_PR, C> => {
    return item !== null && typeof item === 'object' &&
        (item as Connection<O_PH, Input, C>).targetPhaseNodeId === undefined &&
        typeof (item as Termination<O_PH, O_PR, C>).terminate === 'function' &&
        typeof (item as Termination<O_PH, O_PR, C>).id === 'string'; // Check for id property
};
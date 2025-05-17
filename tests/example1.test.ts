import { Input, Output, PhaseNode, Process, Phase, executeProcess } from '../src/zealux';

// --- 1. Define Concrete Phase Implementations ---

// Phase 1: Adds 1 to the input number
const addOnePhase: Phase = {
    name: 'AddOne',
    execute: async (input: Input): Promise<Output> => {
        // Assuming input has a 'value' property for this example
        const inputValue = (input as any).value;
        console.log(`AddOnePhase: Received ${inputValue}`);
        const result = inputValue + 1;
        console.log(`AddOnePhase: Outputting ${result}`);
        return { value: result };
    }
};

// Phase 2: Multiplies the input number by 2
const multiplyByTwoPhase: Phase = {
    name: 'MultiplyByTwo',
    execute: async (input: Input): Promise<Output> => {
        const inputValue = (input as any).value;
        console.log(`MultiplyByTwoPhase: Received ${inputValue}`);
        const result = inputValue * 2;
        console.log(`MultiplyByTwoPhase: Outputting ${result}`);
        return { value: result };
    }
};

// Phase 3: Converts the number to a string
const stringifyPhase: Phase = {
    name: 'Stringify',
    execute: async (input: Input): Promise<Output> => {
        const inputValue = (input as any).value;
        console.log(`StringifyPhase: Received ${inputValue}`);
        const result = `The final number is: ${inputValue}`;
        console.log(`StringifyPhase: Outputting "${result}"`);
        return { value: result };
    }
};

// --- 2. Instantiate Phases (already defined as objects) ---
// No explicit instantiation step needed like with classes,
// addOnePhase, multiplyByTwoPhase, and stringifyPhase are ready to be used.

// --- 3. Define PhaseNodes ---
const nodeA: PhaseNode = {
    id: 'nodeA',
    phase: addOnePhase, // Use the functional phase object
    next: [{ targetPhaseNodeId: 'nodeB' }],
};

const nodeB: PhaseNode = {
    id: 'nodeB',
    phase: multiplyByTwoPhase, // Use the functional phase object
    next: [{ targetPhaseNodeId: 'nodeC' }],
};

const nodeC: PhaseNode = {
    id: 'nodeC',
    phase: stringifyPhase, // Use the functional phase object
    next: { id: 'end', terminate: (output: Output) => output }
};

// --- 4. Define the Process ---
const mySimpleProcess: Process = {
    name: 'MySimpleProcess',
    context: {}, // Add any relevant context
    phases: {
        nodeA: nodeA,
        nodeB: nodeB,
        nodeC: nodeC,
    },
    startPhaseId: 'nodeA',
};

// --- 5. Execute the Process ---
async function runExample() {
    const initialProcessInput: Input = { value: 10 }; // Generic input
    console.log(
        `Executing process "${mySimpleProcess.name}" with initial input:`,
        initialProcessInput
    );

    try {
        const [results, phaseResults] = await executeProcess(
            mySimpleProcess,
            initialProcessInput
        );
        console.log("\nProcess Execution Results:");
        for (const nodeId in results) {
            console.log(`Output from ${nodeId}:`, phaseResults.get(nodeId));
        }

        // Example: Accessing a specific end phase result
        if (results.get('end')) {
            console.log("\nFinal output from StringifyPhase (nodeC):", (results.get('end') as any).value);
        }

    } catch (error) {
        console.error("\nError during process execution:", error);
    }
}

// Run the example
runExample();


describe('example1', () => {

    test('runExample', async () => {
        // Run the example
        runExample();
    });
});
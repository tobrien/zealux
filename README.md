Zealux, as a library focused on creating a system to execute a **Processor Pipeline**, can be described as follows:

**Zealux** provides a streamlined, modular framework to manage and execute **Processor Pipelines**—sequences of computational steps or tasks executed systematically to process data or events. It allows developers to define, connect, and orchestrate individual processors into efficient workflows, supporting clear separation of concerns, scalability, and ease of maintenance.

### Core Concepts:

1. **Processor**:
   Individual computational unit responsible for a specific, well-defined operation (e.g., parsing data, validating inputs, transforming records).

2. **Pipeline**:
   A structured sequence or graph of processors, allowing data or events to flow through multiple processing stages seamlessly.

3. **Execution Engine**:
   Manages the lifecycle of processors within a pipeline, coordinating initialization, execution order, concurrency, error handling, and resource management.

4. **Pipeline Definition**:
   Clear, configurable declarations for how processors interact, ensuring pipelines are easy to define, understand, modify, and debug.

### Why Zealux?

* **Modularity**: Easy plug-and-play processors to extend or modify pipeline behavior.
* **Robustness**: Handles complex execution scenarios with built-in error handling and resource management.
* **Scalability**: Designed for high performance, enabling parallel execution and efficient handling of large-scale processing.
* **Developer-friendly**: Clean, intuitive APIs for building and managing pipelines.

This architecture makes **Zealux** ideal for applications like data transformation, event handling, ETL (Extract, Transform, Load) processes, middleware orchestration, and automation workflows—anywhere a structured pipeline execution model is advantageous.

### Example Usage

Here's a conceptual example of how you might define and execute a simple process using Zealux in TypeScript:

```js
import { Process, Phase, Execution } from '@tobrien/zealux';

// --- 1. Define Concrete Phase Implementations ---

// Phase 1: Adds 1 to the input number
const addOnePhase: Phase.Instance = {
    name: 'AddOne',
    execute: async (input: Phase.Input): Promise<Phase.Output> => {
        // Assuming input has a 'value' property for this example
        const inputValue = (input as any).value;
        console.log(`AddOnePhase: Received ${inputValue}`);
        const result = inputValue + 1;
        console.log(`AddOnePhase: Outputting ${result}`);
        return { value: result };
    }
};

// Phase 2: Multiplies the input number by 2
const multiplyByTwoPhase: Phase.Instance = {
    name: 'MultiplyByTwo',
    execute: async (input: Phase.Input): Promise<Phase.Output> => {
        const inputValue = (input as any).value;
        console.log(`MultiplyByTwoPhase: Received ${inputValue}`);
        const result = inputValue * 2;
        console.log(`MultiplyByTwoPhase: Outputting ${result}`);
        return { value: result };
    }
};

// Phase 3: Converts the number to a string
const stringifyPhase: Phase.Instance = {
    name: 'Stringify',
    execute: async (input: Phase.Input): Promise<Phase.Output> => {
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
const nodeA: Process.PhaseNode = {
    id: 'nodeA',
    phase: addOnePhase, // Use the functional phase object
    next: [{ targetPhaseNodeId: 'nodeB' }],
};

const nodeB: Process.PhaseNode = {
    id: 'nodeB',
    phase: multiplyByTwoPhase, // Use the functional phase object
    next: [{ targetPhaseNodeId: 'nodeC' }],
};

const nodeC: Process.PhaseNode = {
    id: 'nodeC',
    phase: stringifyPhase, // Use the functional phase object
    next: [], // This is an end phase
    isEndPhase: true,
};

// --- 4. Define the Process ---
const mySimpleProcess: Process.Instance = {
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
    const initialProcessInput: Phase.Input = { value: 10 }; // Generic input
    console.log(
        `Executing process "${mySimpleProcess.name}" with initial input:`,
        initialProcessInput
    );

    try {
        const results: Execution.ExecutionResults = await Execution.executeProcess(
            mySimpleProcess,
            initialProcessInput
        );
        console.log("\nProcess Execution Results:");
        for (const nodeId in results) {
            console.log(`Output from ${nodeId}:`, results[nodeId]);
        }

        // Example: Accessing a specific end phase result
        if (results.nodeC) {
            console.log("\nFinal output from StringifyPhase (nodeC):", (results.nodeC as any).value);
        }

    } catch (error) {
        console.error("\nError during process execution:", error);
    }
}

// Run the example
runExample();

/*
Expected console output:

Executing process "MySimpleProcess" with initial input: { value: 10 }
AddOnePhase: Received 10
AddOnePhase: Outputting 11
MultiplyByTwoPhase: Received 11
MultiplyByTwoPhase: Outputting 22
StringifyPhase: Received 22
StringifyPhase: Outputting "The final number is: 22"

Process Execution Results:
Output from nodeC: { value: 'The final number is: 22' }

Final output from StringifyPhase (nodeC): The final number is: 22
*/
```


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
import { Input, Output, PhaseNode, Process, Phase, executeProcess } from '@tobrien/zealux';

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

/*
Expected console output:

MultiplyByTwoPhase: Received 11
MultiplyByTwoPhase: Outputting 22
StringifyPhase: Received 22
StringifyPhase: Outputting "The final number is: 22"

*/
```

### Creating a Process with Multiple End States

The following example shows how to configure a process that has multiple end results.  In this example, the initial phase node defnition routes output to 2 nodes.

```js
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

// Phase 4: Squares the input number
const squarePhase: Phase = {
    name: 'Square',
    execute: async (input: Input): Promise<Output> => {
        const inputValue = (input as any).value;
        console.log(`SquarePhase: Received ${inputValue}`);
        const result = inputValue * inputValue;
        console.log(`SquarePhase: Outputting ${result}`);
        return { value: result };
    }
};

// --- 2. Instantiate Phases (already defined as objects) ---
// No explicit instantiation step needed like with classes,
// addOnePhase, multiplyByTwoPhase, and stringifyPhase are ready to be used.
// squarePhase is also ready.

// --- 3. Define PhaseNodes ---
const nodeA: PhaseNode = {
    id: 'nodeA',
    phase: addOnePhase, // Use the functional phase object
    next: [
        { targetPhaseNodeId: 'nodeB' },
        { targetPhaseNodeId: 'nodeD' }
    ],
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

const nodeD: PhaseNode = {
    id: 'nodeD',
    phase: squarePhase, // Use the functional phase object
    next: { id: 'end2', terminate: (output: Output) => output }
};

// --- 4. Define the Process ---
const mySimpleProcess: Process = {
    name: 'MySimpleProcess',
    context: {}, // Add any relevant context
    phases: {
        nodeA: nodeA,
        nodeB: nodeB,
        nodeC: nodeC,
        nodeD: nodeD,
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
        if (results.get('end2')) {
            console.log("\nFinal output from SquarePhase (nodeD):", (results.get('end2') as any).value);
        }

    } catch (error) {
        console.error("\nError during process execution:", error);
    }
}

// Run the example
runExample();
```

Copyright 2025 Tim O'Brien

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


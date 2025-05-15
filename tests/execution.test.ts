import { jest } from '@jest/globals';
import { validateProcess, executeProcess, ExecutionResults } from '../src/execution';
import { Instance as ProcessInstance, Context } from '../src/process';
import * as PhaseNode from '../src/phasenode';
import * as Phase from '../src/phase'; import { Output } from 'phase';


// Define more specific Input/Output for tests if desired, though base interfaces are {}
interface TestInput extends Phase.Input {
    data?: any;
    [key: string]: any; // Allow other properties
}

interface TestOutput extends Phase.Output {
    data?: any;
    [key: string]: any; // Allow other properties
}

// Mocks
const mockPhaseExecute: jest.MockedFunction<(input: Phase.Input) => Promise<Phase.Output>> =
    jest.fn(async (input: TestInput): Promise<TestOutput> => {
        if (input && typeof input.data !== 'undefined') {
            return { data: `processed ${input.data}` };
        }
        return { data: 'processed without specific input data' };
    });

const mockPhase: Phase.Instance = {
    name: 'Mock Phase',
    execute: mockPhaseExecute,
};

const mockContext: Context = {};

describe('validateProcess', () => {
    let baseProcess: ProcessInstance;

    beforeEach(() => {
        mockPhaseExecute.mockClear(); // Clear mock calls before each test
        baseProcess = {
            name: 'Test Process',
            context: mockContext,
            startPhaseId: 'start',
            phases: {
                start: {
                    id: 'start',
                    phase: mockPhase,
                    next: [{ targetPhaseNodeId: 'end' }],
                    isEndPhase: false,
                } as PhaseNode.Instance,
                end: {
                    id: 'end',
                    phase: mockPhase,
                    next: [],
                    isEndPhase: true,
                } as PhaseNode.Instance,
            },
        };
    });

    test('should return no errors for a valid process', () => {
        expect(validateProcess(baseProcess)).toEqual([]);
    });

    test('should return error if process definition is missing', () => {
        expect(validateProcess(null as any)).toEqual(["Process definition is missing or not an object."]);
        expect(validateProcess(undefined as any)).toEqual(["Process definition is missing or not an object."]);
    });

    test('should return error if process.phases is missing', () => {
        const invalidProcess = { ...baseProcess, phases: undefined as any } as ProcessInstance;
        expect(validateProcess(invalidProcess)).toContain("Process 'phases' collection is missing or not an object.");
    });

    test('should return error if process.startPhaseId is missing or invalid', () => {
        const invalidProcess1 = { ...baseProcess, startPhaseId: undefined as any } as ProcessInstance;
        expect(validateProcess(invalidProcess1)).toContain("Process 'startPhaseId' is missing or invalid.");
        const invalidProcess2 = { ...baseProcess, startPhaseId: '' } as ProcessInstance; // Ensure name and context are present
        expect(validateProcess(invalidProcess2)).toContain("Process 'startPhaseId' is missing or invalid.");
    });

    test('should return error if startPhaseId does not exist in phases', () => {
        const invalidProcess = { ...baseProcess, startPhaseId: 'nonexistent' };
        expect(validateProcess(invalidProcess)).toContain('Start phase ID "nonexistent" does not exist in the phases collection.');
    });

    test('should return error if phases is empty but startPhaseId is present', () => {
        const invalidProcess: ProcessInstance = {
            name: 'Test',
            context: mockContext,
            startPhaseId: 'start',
            phases: {},
        };
        expect(validateProcess(invalidProcess)).toContain("Process has a startPhaseId but no phases defined.");
    });

    test('should return error for invalid PhaseNode definition', () => {
        const invalidProcess: ProcessInstance = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: null as any, // node is null
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode definition for ID "start" is missing or invalid.');
    });

    test('should return error if PhaseNode ID does not match its key', () => {
        const invalidProcess: ProcessInstance = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: { ...(baseProcess.phases.start as PhaseNode.Instance), id: 'wrong-id' },
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode ID "wrong-id" does not match its key "start" in the phases collection.');
    });

    test('should return error if PhaseNode phase or execute method is missing', () => {
        const invalidProcess1: ProcessInstance = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: { ...(baseProcess.phases.start as PhaseNode.Instance), phase: undefined as any },
            },
        };
        expect(validateProcess(invalidProcess1)).toContain('PhaseNode "start" is missing a valid phase instance with an execute method.');

        const invalidProcess2: ProcessInstance = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: { ...(baseProcess.phases.start as PhaseNode.Instance), phase: { name: 'Test', execute: undefined as any } as Phase.Instance },
            },
        };
        expect(validateProcess(invalidProcess2)).toContain('PhaseNode "start" is missing a valid phase instance with an execute method.');
    });

    test('should return error for invalid connection (targetPhaseNodeId missing)', () => {
        const invalidProcess: ProcessInstance = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: {
                    ...(baseProcess.phases.start as PhaseNode.Instance),
                    next: [{ targetPhaseNodeId: undefined as any } as any],
                },
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode "start" has an invalid connection (targetPhaseNodeId missing or invalid).');
    });

    test('should return error for connection to non-existent targetPhaseNodeId', () => {
        const invalidProcess: ProcessInstance = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: {
                    ...(baseProcess.phases.start as PhaseNode.Instance),
                    next: [{ targetPhaseNodeId: 'nonexistent-target' }],
                },
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode "start" has a connection to non-existent targetPhaseNodeId "nonexistent-target".');
    });

    test('should return error for connection with invalid transform', () => {
        const invalidProcess: ProcessInstance = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: {
                    ...(baseProcess.phases.start as PhaseNode.Instance),
                    next: [{ targetPhaseNodeId: 'end', transform: 'not-a-function' as any }],
                },
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode "start" has a connection to "end" with an invalid transform (should be a function).');
    });
});

// Placeholder for executeProcess tests
describe('executeProcess', () => {
    let baseProcess: ProcessInstance;
    let mockPhase1Execute: jest.MockedFunction<(input: Phase.Input) => Promise<Phase.Output>>;
    let mockPhase2Execute: jest.MockedFunction<(input: Phase.Input) => Promise<Phase.Output>>;
    let mockPhase3Execute: jest.MockedFunction<(input: Phase.Input) => Promise<Phase.Output>>;

    beforeEach(() => {
        mockPhase1Execute = jest.fn(async (input: TestInput): Promise<TestOutput> => ({ data: `phase1 processed ${input.data}` }));
        mockPhase2Execute = jest.fn(async (input: TestInput): Promise<TestOutput> => ({ data: `phase2 processed ${input.data}` }));
        mockPhase3Execute = jest.fn(async (input: TestInput): Promise<TestOutput> => ({ data: `phase3 processed ${input.data}` }));

        const phase1: Phase.Instance = { name: 'Phase 1', execute: mockPhase1Execute };
        const phase2: Phase.Instance = { name: 'Phase 2', execute: mockPhase2Execute };
        const phase3: Phase.Instance = { name: 'Phase 3', execute: mockPhase3Execute };


        baseProcess = {
            name: 'Test Execution Process',
            context: mockContext,
            startPhaseId: 'p1',
            phases: {
                p1: { id: 'p1', phase: phase1, next: [{ targetPhaseNodeId: 'p2' }] } as PhaseNode.Instance,
                p2: { id: 'p2', phase: phase2, next: [{ targetPhaseNodeId: 'p3' }], isEndPhase: false } as PhaseNode.Instance,
                p3: { id: 'p3', phase: phase3, next: [], isEndPhase: true } as PhaseNode.Instance,
            },
        };
    });

    test('should execute a simple linear process and return end phase results', async () => {
        const initialInput: TestInput = { data: 'start' };
        const results = await executeProcess(baseProcess, initialInput);

        expect(mockPhase1Execute).toHaveBeenCalledWith(initialInput);
        expect(mockPhase2Execute).toHaveBeenCalledWith({ data: 'phase1 processed start' });
        expect(mockPhase3Execute).toHaveBeenCalledWith({ data: 'phase2 processed phase1 processed start' });
        expect(results).toEqual({
            p3: { data: 'phase3 processed phase2 processed phase1 processed start' },
        });
    });

    test('should throw error for invalid process definition', async () => {
        const invalidProcess = { ...baseProcess, startPhaseId: 'nonexistent' } as ProcessInstance;
        const initialInput: TestInput = { data: 'start' };
        await expect(executeProcess(invalidProcess, initialInput)).rejects.toThrow(/Invalid process definition:/);
    });

    test('should use transform function if provided', async () => {
        const transformFn = jest.fn((output: TestOutput): TestInput => ({ data: `transformed ${output.data}` }));

        baseProcess.phases.p1.next = [{ targetPhaseNodeId: 'p2', transform: transformFn }];

        const initialInput: TestInput = { data: 'start' };
        await executeProcess(baseProcess, initialInput);

        expect(mockPhase1Execute).toHaveBeenCalledWith(initialInput);
        expect(transformFn).toHaveBeenCalledWith({ data: 'phase1 processed start' });
        expect(mockPhase2Execute).toHaveBeenCalledWith({ data: 'transformed phase1 processed start' });
        expect(mockPhase3Execute).toHaveBeenCalledWith({ data: 'phase2 processed transformed phase1 processed start' });
    });

    test('should handle error in transform function', async () => {
        const transformError = new Error('Transform failed');
        const transformFn = jest.fn((output: TestOutput): TestInput => { throw transformError; });

        baseProcess.phases.p1.next = [{ targetPhaseNodeId: 'p2', transform: transformFn }];

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

        const initialInput: TestInput = { data: 'start' };
        const results = await executeProcess(baseProcess, initialInput);

        expect(mockPhase1Execute).toHaveBeenCalledWith(initialInput);
        expect(transformFn).toHaveBeenCalledWith({ data: 'phase1 processed start' });
        expect(mockPhase2Execute).not.toHaveBeenCalled(); // p2 should not execute
        expect(mockPhase3Execute).not.toHaveBeenCalled(); // p3 should not execute

        expect(results).toEqual({}); // No end phase results due to transform error preventing p2 & p3

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in transform for connection p1 -> p2:', transformError);
        expect(consoleWarnSpy).toHaveBeenCalledWith("Process execution completed with errors:", expect.arrayContaining([
            expect.objectContaining({ nodeId: 'p2', error: transformError })
        ]));

        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });


    test('should handle branching and return results from all explicit end phases', async () => {
        const mockPhase4Execute = jest.fn(async (input: TestInput): Promise<TestOutput> => ({ data: `phase4 processed ${input.data}` }));
        const phase4: Phase.Instance = { name: 'Phase 4', execute: mockPhase4Execute };

        baseProcess.phases.p1.next = [
            { targetPhaseNodeId: 'p2' },
            { targetPhaseNodeId: 'p4' }
        ];
        baseProcess.phases.p2.next = []; // p2 becomes an end phase
        baseProcess.phases.p2.isEndPhase = true;
        baseProcess.phases.p3.isEndPhase = false; // p3 is no longer an end phase in this path
        baseProcess.phases.p4 = { id: 'p4', phase: phase4, next: [], isEndPhase: true } as PhaseNode.Instance;


        const initialInput: TestInput = { data: 'branch' };
        const results = await executeProcess(baseProcess, initialInput);

        expect(mockPhase1Execute).toHaveBeenCalledWith(initialInput);
        // p1 output: { data: 'phase1 processed branch' }
        expect(mockPhase2Execute).toHaveBeenCalledWith({ data: 'phase1 processed branch' });
        expect(mockPhase4Execute).toHaveBeenCalledWith({ data: 'phase1 processed branch' });
        expect(mockPhase3Execute).not.toHaveBeenCalled(); // p3 is not reachable or not an end phase

        expect(results).toEqual({
            p2: { data: 'phase2 processed phase1 processed branch' },
            p4: { data: 'phase4 processed phase1 processed branch' },
        });
    });

    test('should return results from implicit leaf nodes if no explicit end phases are marked', async () => {
        // Modify baseProcess so no phases are marked isEndPhase = true
        // p1 -> p2 (leaf)
        // p1 -> p3 (leaf)
        const mockP1 = jest.fn(async (input: TestInput) => ({ data: `p1 out ${input.data}` }));
        const mockP2 = jest.fn(async (input: TestInput) => ({ data: `p2 out ${input.data}` }));
        const mockP3 = jest.fn(async (input: TestInput) => ({ data: `p3 out ${input.data}` }));

        const processNoEndPhases: ProcessInstance = {
            name: 'No Explicit End',
            context: mockContext,
            startPhaseId: 'n_p1',
            phases: {
                n_p1: { id: 'n_p1', phase: { name: 'nP1', execute: mockP1 }, next: [{ targetPhaseNodeId: 'n_p2' }, { targetPhaseNodeId: 'n_p3' }] } as PhaseNode.Instance,
                n_p2: { id: 'n_p2', phase: { name: 'nP2', execute: mockP2 }, next: [] } as PhaseNode.Instance, // Implicit end
                n_p3: { id: 'n_p3', phase: { name: 'nP3', execute: mockP3 }, next: [] } as PhaseNode.Instance, // Implicit end
            }
        };

        const initialInput: TestInput = { data: 'implicit' };
        const results = await executeProcess(processNoEndPhases, initialInput);

        expect(mockP1).toHaveBeenCalledWith(initialInput);
        expect(mockP2).toHaveBeenCalledWith({ data: 'p1 out implicit' });
        expect(mockP3).toHaveBeenCalledWith({ data: 'p1 out implicit' });

        expect(results).toEqual({
            n_p2: { data: 'p2 out p1 out implicit' },
            n_p3: { data: 'p3 out p1 out implicit' },
        });
    });

    test('should handle cycles correctly and not re-execute nodes unnecessarily', async () => {
        // p1 -> p2 -> p1 (cycle), p2 -> p3 (end)
        baseProcess.phases.p2.next = [
            { targetPhaseNodeId: 'p1' }, // cycle back
            { targetPhaseNodeId: 'p3' }  // path to end
        ];

        const initialInput: TestInput = { data: 'cycle test' };
        const results = await executeProcess(baseProcess, initialInput);

        // p1 executes once with initial input
        expect(mockPhase1Execute).toHaveBeenCalledTimes(1);
        expect(mockPhase1Execute).toHaveBeenCalledWith(initialInput);

        // p2 executes once with output from p1
        expect(mockPhase2Execute).toHaveBeenCalledTimes(1);
        expect(mockPhase2Execute).toHaveBeenCalledWith({ data: 'phase1 processed cycle test' });

        // p3 executes once with output from p2
        expect(mockPhase3Execute).toHaveBeenCalledTimes(1);
        expect(mockPhase3Execute).toHaveBeenCalledWith({ data: 'phase2 processed phase1 processed cycle test' });

        expect(results).toEqual({
            p3: { data: 'phase3 processed phase2 processed phase1 processed cycle test' },
        });
    });

    test('should warn if an explicit end phase did not execute', async () => {
        // p1 -> p2 (executes), p3 (unreachable, marked as end)
        const mockP1: jest.MockedFunction<(input: Phase.Input) => Promise<Phase.Output>> = jest.fn(async (input: TestInput) => ({ data: `p1 out ${input.data}` }));
        const mockP2: jest.MockedFunction<(input: Phase.Input) => Promise<Phase.Output>> = jest.fn(async (input: TestInput) => ({ data: `p2 out ${input.data}` }));
        const mockP3: jest.MockedFunction<(input: Phase.Input) => Promise<Phase.Output>> = jest.fn(async (input: TestInput) => ({ data: `p3 out ${input.data}` }));


        const processWithUnreachableEnd: ProcessInstance = {
            name: 'Unreachable End',
            context: mockContext,
            startPhaseId: 'u_p1',
            phases: {
                u_p1: { id: 'u_p1', phase: { name: 'uP1', execute: mockP1 }, next: [{ targetPhaseNodeId: 'u_p2' }] } as PhaseNode.Instance,
                u_p2: { id: 'u_p2', phase: { name: 'uP2', execute: mockP2 }, next: [], isEndPhase: true } as PhaseNode.Instance,
                u_p3: { id: 'u_p3', phase: { name: 'uP3', execute: mockP3 }, next: [], isEndPhase: true } as PhaseNode.Instance, // Unreachable
            }
        };
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        const initialInput: TestInput = { data: 'unreachable' };

        const results = await executeProcess(processWithUnreachableEnd, initialInput);

        expect(mockP1).toHaveBeenCalled();
        expect(mockP2).toHaveBeenCalled();
        expect(mockP3).not.toHaveBeenCalled();
        expect(results).toEqual({
            u_p2: { data: 'p2 out p1 out unreachable' }
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith('End phase "u_p3" did not execute or produce a result.');
        consoleWarnSpy.mockRestore();
    });
});

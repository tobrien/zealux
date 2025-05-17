import { jest } from '@jest/globals';
import { Phase } from '../src/phase';
import { PhaseNode } from '../src/phasenode';
import { Context } from '../src/context';
import { Process } from '../src/process';
import { validateProcess } from '../src/validator';
import { Input } from '../src/input';
import { Output } from '../src/output';

// Define more specific Input/Output for tests if desired, though base interfaces are {}
interface TestInput extends Input {
    data?: any;
    [key: string]: any; // Allow other properties
}

interface TestOutput extends Output {
    data?: any;
    [key: string]: any; // Allow other properties
}

// Mocks
const mockPhaseExecute: jest.MockedFunction<(input: Input) => Promise<Output>> =
    jest.fn(async (input: TestInput): Promise<TestOutput> => {
        if (input && typeof input.data !== 'undefined') {
            return { data: `processed ${input.data}` };
        }
        return { data: 'processed without specific input data' };
    });

const mockPhase: Phase = {
    name: 'Mock Phase',
    execute: mockPhaseExecute,
};

const mockContext: Context = {};

describe('validateProcess', () => {
    let baseProcess: Process;

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
                } as PhaseNode,
                end: {
                    id: 'end',
                    phase: mockPhase,
                    next: [],
                    isEndPhase: true,
                } as PhaseNode,
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
        const invalidProcess = { ...baseProcess, phases: undefined as any } as Process;
        expect(validateProcess(invalidProcess)).toContain("Process 'phases' collection is missing or not an object.");
    });

    test('should return error if process.startPhaseId is missing or invalid', () => {
        const invalidProcess1 = { ...baseProcess, startPhaseId: undefined as any } as Process;
        expect(validateProcess(invalidProcess1)).toContain("Process 'startPhaseId' is missing or invalid.");
        const invalidProcess2 = { ...baseProcess, startPhaseId: '' } as Process; // Ensure name and context are present
        expect(validateProcess(invalidProcess2)).toContain("Process 'startPhaseId' is missing or invalid.");
    });

    test('should return error if startPhaseId does not exist in phases', () => {
        const invalidProcess = { ...baseProcess, startPhaseId: 'nonexistent' };
        expect(validateProcess(invalidProcess)).toContain('Start phase ID "nonexistent" does not exist in the phases collection.');
    });

    test('should return error if phases is empty but startPhaseId is present', () => {
        const invalidProcess: Process = {
            name: 'Test',
            context: mockContext,
            startPhaseId: 'start',
            phases: {},
        };
        expect(validateProcess(invalidProcess)).toContain("Process has a startPhaseId but no phases defined.");
    });

    test('should return error for invalid PhaseNode definition', () => {
        const invalidProcess: Process = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: null as any, // node is null
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode definition for ID "start" is missing or invalid.');
    });

    test('should return error if PhaseNode ID does not match its key', () => {
        const invalidProcess: Process = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: { ...(baseProcess.phases.start as PhaseNode), id: 'wrong-id' },
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode ID "wrong-id" does not match its key "start" in the phases collection.');
    });

    test('should return error if PhaseNode phase or execute method is missing', () => {
        const invalidProcess1: Process = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: { ...(baseProcess.phases.start as PhaseNode), phase: undefined as any },
            },
        };
        expect(validateProcess(invalidProcess1)).toContain('PhaseNode "start" is missing a valid phase instance with an execute method.');

        const invalidProcess2: Process = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: { ...(baseProcess.phases.start as PhaseNode), phase: { name: 'Test', execute: undefined as any } as Phase },
            },
        };
        expect(validateProcess(invalidProcess2)).toContain('PhaseNode "start" is missing a valid phase instance with an execute method.');
    });

    test('should return error for invalid connection (targetPhaseNodeId missing)', () => {
        const invalidProcess: Process = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: {
                    ...(baseProcess.phases.start as PhaseNode),
                    next: [{ targetPhaseNodeId: undefined as any } as any],
                },
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode "start" has an invalid connection (targetPhaseNodeId missing or invalid).');
    });

    test('should return error for connection to non-existent targetPhaseNodeId', () => {
        const invalidProcess: Process = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: {
                    ...(baseProcess.phases.start as PhaseNode),
                    next: [{ targetPhaseNodeId: 'nonexistent-target' }],
                },
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode "start" has a connection to non-existent targetPhaseNodeId "nonexistent-target".');
    });

    test('should return error for connection with invalid transform', () => {
        const invalidProcess: Process = {
            ...baseProcess,
            phases: {
                ...baseProcess.phases,
                start: {
                    ...(baseProcess.phases.start as PhaseNode),
                    next: [{ targetPhaseNodeId: 'end', transform: 'not-a-function' as any }],
                },
            },
        };
        expect(validateProcess(invalidProcess)).toContain('PhaseNode "start" has a connection to "end" with an invalid transform (should be a function).');
    });
});
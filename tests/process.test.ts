import * as PhaseNode from '../src/phasenode';
import * as Process from '../src/process';
import { Instance } from '../src/process';
import { isProcess } from '../src/process';

describe('isProcess', () => {
    const validContext: Process.Context = {};
    const validPhases: Record<string, PhaseNode.Instance> = {
        phase1: { id: 'phase1', phase: { name: 'TestPhase', execute: async (input: {}) => ({ output: input }) }, next: [], },
    };

    const validProcess: Process.Instance = {
        name: 'Test Process',
        context: validContext,
        phases: validPhases,
        startPhaseId: 'phase1',
    };

    it('should return true for a valid process object', () => {
        expect(isProcess(validProcess)).toBe(true);
    });

    it('should return false if name is missing', () => {
        const invalidProcess = { ...validProcess, name: undefined };
        expect(isProcess(invalidProcess)).toBe(false);
    });

    it('should return false if name is not a string', () => {
        const invalidProcess = { ...validProcess, name: 123 };
        expect(isProcess(invalidProcess)).toBe(false);
    });

    it('should return false if context is missing', () => {
        const invalidProcess = { ...validProcess, context: undefined };
        expect(isProcess(invalidProcess)).toBe(false);
    });

    it('should return false if context is not an object', () => {
        const invalidProcess = { ...validProcess, context: 'not an object' };
        expect(isProcess(invalidProcess)).toBe(false);
    });

    it('should return false if phases is missing', () => {
        const invalidProcess = { ...validProcess, phases: undefined };
        expect(isProcess(invalidProcess)).toBe(false);
    });

    it('should return false if phases is not an object', () => {
        const invalidProcess = { ...validProcess, phases: 'not an object' };
        expect(isProcess(invalidProcess)).toBe(false);
    });

    it('should return false if startPhaseId is missing', () => {
        const invalidProcess = { ...validProcess, startPhaseId: undefined };
        expect(isProcess(invalidProcess)).toBe(false);
    });

    it('should return false if startPhaseId is not a string', () => {
        const invalidProcess = { ...validProcess, startPhaseId: 123 };
        expect(isProcess(invalidProcess)).toBe(false);
    });

    it('should return false for null input', () => {
        expect(isProcess(null)).toBe(false);
    });

    it('should return false for undefined input', () => {
        expect(isProcess(undefined)).toBe(false);
    });

    it('should return false for a string input', () => {
        expect(isProcess('this is a string')).toBe(false);
    });

    it('should return false for a number input', () => {
        expect(isProcess(12345)).toBe(false);
    });

    it('should return false for an empty object', () => {
        expect(isProcess({})).toBe(false);
    });
});

import { Input } from '../src/input';
import { Output } from '../src/output';
import { isPhase, Phase } from '../src/phase';


describe('Phase', () => {
    describe('isPhase', () => {
        const mockExecute = async (input: Input): Promise<Output> => { return {}; };

        it('should return true for a valid phase instance', () => {
            const validInstance: Phase = {
                name: 'testPhase',
                execute: mockExecute,
            };
            expect(isPhase(validInstance)).toBe(true);
        });

        it('should return false if name is missing', () => {
            const invalidInstance = {
                execute: mockExecute,
            };
            expect(isPhase(invalidInstance)).toBe(false);
        });

        it('should return false if execute is missing', () => {
            const invalidInstance = {
                name: 'testPhase',
            };
            expect(isPhase(invalidInstance)).toBe(false);
        });

        it('should return false if name is not a string', () => {
            const invalidInstance = {
                name: 123,
                execute: mockExecute,
            };
            expect(isPhase(invalidInstance)).toBe(false);
        });

        it('should return false if execute is not a function', () => {
            const invalidInstance = {
                name: 'testPhase',
                execute: 'notAFunction',
            };
            expect(isPhase(invalidInstance)).toBe(false);
        });

        it('should return false for null', () => {
            expect(isPhase(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isPhase(undefined)).toBe(false);
        });

        it('should return false for a non-object type (e.g., string)', () => {
            expect(isPhase('notAnObject')).toBe(false);
        });

        it('should return false for an empty object', () => {
            expect(isPhase({})).toBe(false);
        });
    });
});

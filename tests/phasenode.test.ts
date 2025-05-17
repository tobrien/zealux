import { PhaseNode } from '../src/phasenode';
import { Phase } from '../src/phase';
import { isPhaseNode } from '../src/phasenode';

describe('PhaseNode', () => {
    // Tests will go here
    describe('isPhaseNode', () => {
        const mockPhase: Phase = {
            name: 'phase1',
            execute: async (input: {}) => ({ output: input }),
        };

        it('should return true for a valid PhaseNode object', () => {
            const validNode: PhaseNode = {
                id: 'node1',
                phase: mockPhase,
                next: [],
            };
            expect(isPhaseNode(validNode)).toBe(true);
        });

        it('should return false if id is missing', () => {
            const invalidNode: any = {
                phase: mockPhase,
                next: [],
            };
            expect(isPhaseNode(invalidNode)).toBe(false);
        });

        it('should return false if phase is missing', () => {
            const invalidNode: any = {
                id: 'node1',
                next: [],
            };
            expect(isPhaseNode(invalidNode)).toBe(false);
        });

        it('should return false if phase is not a valid Phase object', () => {
            const invalidNode: PhaseNode = {
                id: 'node1',
                phase: { έργο: 'not a phase' } as any, // Intentional Greek characters to ensure it's not a phase
                next: [],
            };
            expect(isPhaseNode(invalidNode)).toBe(false);
        });

        it('should return false for null', () => {
            expect(isPhaseNode(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isPhaseNode(undefined)).toBe(false);
        });

        it('should return false for a primitive type', () => {
            expect(isPhaseNode('not a node')).toBe(false);
        });
    });
});

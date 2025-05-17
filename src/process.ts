//import * as ClassifyPhase from './phases/classify';
// import * as TranscribePhase from './phases/transcribe';
// import * as ComposePhase from './phases/compose';
// import * as CompletePhase from './phases/complete';
import { Context } from './context';
import { PhaseNode } from './phasenode';

export interface Process<C extends Context = Context> {
    name: string;
    context: C;
    phases: Record<string, PhaseNode>;
    startPhaseId: string;
}

export const isProcess = (obj: any): obj is Process => {
    return obj !== undefined && obj !== null && typeof obj === 'object' && typeof obj.name === 'string' && typeof obj.context === 'object' && typeof obj.phases === 'object' && typeof obj.startPhaseId === 'string';
}


//import * as ClassifyPhase from './phases/classify';
// import * as TranscribePhase from './phases/transcribe';
// import * as ComposePhase from './phases/compose';
// import * as CompletePhase from './phases/complete';
import * as Phase from './phase';
import * as PhaseNode from './phasenode';

export interface Context {
    [key: string]: unknown;
}


export interface Instance<C extends Context = Context> {
    name: string;
    context: C;
    phases: Record<string, PhaseNode.Instance>;
    startPhaseId: string;
    end: (output: Phase.Output) => void;
}

export const isProcess = (obj: any): obj is Instance => {
    return obj !== undefined && obj !== null && typeof obj === 'object' && typeof obj.name === 'string' && typeof obj.context === 'object' && typeof obj.phases === 'object' && typeof obj.startPhaseId === 'string';
}


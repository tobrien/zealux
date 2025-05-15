export interface Input {
    [key: string]: unknown;
}

export interface Output {
    [key: string]: unknown;
}


export interface Instance {
    name: string;
    execute: (input: Input) => Promise<Output>;
}

export const isPhase = (obj: any): obj is Instance => {
    return obj !== undefined && obj !== null && typeof obj === 'object' && typeof obj.name === 'string' && typeof obj.execute === 'function';
}
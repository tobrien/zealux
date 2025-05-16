export interface Input {
    [key: string]: unknown;
}

export interface Output {
    [key: string]: unknown;
}


export interface Instance<T extends Input = Input, U extends Output = Output> {
    name: string;
    execute: (input: T) => Promise<U>;
}

export const isPhase = <T extends Input = Input, U extends Output = Output>(obj: any): obj is Instance<T, U> => {
    return obj !== undefined && obj !== null && typeof obj === 'object' && typeof obj.name === 'string' && typeof obj.execute === 'function';
}
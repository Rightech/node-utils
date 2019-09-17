
/* @file ./src/log.js */

interface LogggerOptions {
    level: number; /* 0 | 1 | 2 | 3 | 4 */
    time: 'iso' | 'ru' | 'en';
}
interface Loggger {
    //(msg: string | object, category?: string, level?: number): void;
    setOptions(opts: LogggerOptions): void;

    debug(msg: string): void;
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
}

export declare var log: Loggger;


/* @file ./src/safe.js */
interface SafeOps {
    bit(value: number, bit: number): boolean;

    get<TObject extends object, TKey extends keyof TObject>(object: TObject, path: TKey): TObject[TKey];
    set<TObject extends object, T>(object: TObject, path: string, value:T): T;
    unset<TObject extends object>(object: TObject, path: string): void;
}
export declare var safe: SafeOps;

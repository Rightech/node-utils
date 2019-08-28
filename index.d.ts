
/* @file ./src/log.js */

interface LogggerOptions {
    level: number; /* 0 | 1 | 2 | 3 | 4 */
    time: 'iso' | 'ru' | 'en';
}
interface Loggger {
    (msg: string | object, category?: string, level?: number): void;
    setOptions(opts: LogggerOptions): void;

    debug(msg:string):void;
    info(msg:string):void;
    warn(msg:string):void;
    error(msg:string):void;
}

export declare var log: Loggger;


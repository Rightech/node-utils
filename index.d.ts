
/* @file ./src/log.js */

interface LogggerOptions {
    level: 0 | 1 | 2 | 3 | 4;
    time: 'iso' | 'ru' | 'en';
}
interface Loggger {
    (msg: string | object): void;
    setOptions(opts: LogggerOptions): void;
}

export { Loggger as log };

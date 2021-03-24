/* @file ./src/log.js */
interface LogggerOptions {
  level: number /* 0 | 1 | 2 | 3 | 4 */;
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

  get<TObject extends object, TKey extends keyof TObject>(
    object: TObject,
    path: TKey
  ): TObject[TKey];
  set<TObject extends object, T>(object: TObject, path: string, value: T): T;
  unset<TObject extends object>(object: TObject, path: string): void;
}
export declare var safe: SafeOps;

/* @file ./src/traverse.js */
interface Traverse<T> {
  each(pred: (node: T, parent: T) => any): void;
  find(pred: (node: T) => boolean): T;
  filter(pred: (node: T) => boolean): T[];
}
export declare function traverse<T>(
  tree: T & { children: T[] }
): Traverse<T & { children: T[] }>;

/* @file ./src/template.js */
export declare function template<T>(template: string, context: T): any;

/* @file ./src/filter.js */
export declare function unique<T>(array: T[] = []): T[];
export declare function only<T, K extends keyof T>(
  object: T,
  keys: K | K[] = []
): Pick<T, K>;

/* ----- api/v1 ----- */

export type ObjectId = string &
  Partial<{
    toHexString(): string;
  }>;

export type ItemIdV1 = ObjectId;

export type ItemId = ItemIdV1;

export interface Base {
  _id: ItemId;
  name: string;
  time: number;
  description?: string;

  owner?: ItemId;
  group?: ItemId;

  links?: Record<string, Link[]>;
}

export type Fresh = Omit<Base, "_id">;

export interface Link {
  session: string;
  time: number;
  id: ItemId;
}


/* ----- api/v1/models ----- */

export type BaseNode = {
  type: string;
  id: string;
  name: string;
  description?: string;
  active: boolean;
  children?: ModelNode[];
};

export type SystemNode = BaseNode & {
  type: "subsystem";
};

export type EventNode = BaseNode & {
  type: "event";
};

export type ActionNode = BaseNode & {
  type: "action";
  service: string;
  command?: string;
  params?: Record<string, string>;
};

export type ArgumentNode = BaseNode & {
  type: "argument";
  dataType: ArgumentDataType;
  unit?: string;
};

export type ArgumentDataType =
  | "number"
  | "boolean"
  | "string"
  | "object"
  | string;

export type ModelNode =
  | BaseNode
  | SystemNode
  | EventNode
  | ArgumentNode
  | ActionNode;


export type ModelProps = {
  bots?: boolean;
  protocol?: string;
  idPattern?: string;
};

export interface Model extends Base {
  base: string;
  data: ModelNode;
  props?: ModelProps;
}


/* ----- api/v1/objects ----- */
export type ServiceState = {
  _v: number;
  _ts: number;
  _oid: ItemId;
  _gid: ItemId;

  time: number;
  online: boolean;
};

export type GeographyState = {
  lat: number;
  lon: number;
};

export type GeometryState = {
  x: number;
  y: number;
  z?: number;
};

export type GpsState = GeographyState & {
  alt: number;
  speed: number;
  sats?: number;
};

/**  we love MQTT so much that we even defined it in base types
 *     (but we really shouldn't)  */
export type MqttState = {
  topic: string;
  payload: string;
};

export type State = ServiceState
  & GpsState
  & MqttState 
  & GeometryState 
  & {
    [argumentId: string]: number | boolean | string;
  };

export type Config = {
  [parentId: string]: {
    [argumentId: string]: number | boolean | string;
  };
};

export type Packet = Partial<State>;

export interface RicObject<TState = State, TConfig = Config> extends Base {
  id: string;
  model: ItemId;

  state?: Readonly<TState>;
  config?: TConfig;
}

/**
 * Type alias exported, but not recommended to use
 * sinse it conflicts with JavaScript `Object` built-in
 */
export type Object<TState = State, TConfig = Config> = RicObject<
  TState,
  TConfig
>;


/* ----- api/v1/events ----- */
export interface Event<T = unknown> {
  _msgid: string;
  _oid?: ItemId;
  _gid?: ItemId;

  service?: string;
  event: string;
  time: number;
  data: T;
}


/* ----- api/v1/geofences ----- */
export type Geography = [lat: number, lon: number];

export type GeographyType =
  | "polygon"
  | "polyline"
  | "marker"
  | "circle"
  | "rectangle"
  | "route"
  | string;

export type Geopoint = {
  type: "marker" | "circle";
  center: Geography;
};

export type Geoline = {
  type: "polygon" | "polyline" | "rectangle";
  points: Geography[];
};

export type Waypoint = {
  center: Geography;
  name: string;
  check?: boolean;
};

export type GeorouteTrip = {
  type: "direct" | "return";
  points: Geography[];
  waypoints: Waypoint[];
};

export type Georoute = {
  type: "route";
  trips: GeorouteTrip[];
};

export type Geoshape = Geopoint | Geoline | Georoute;

export interface Geofence extends Base {
  color?: string;
  shape?: Geoshape;
  floors?: Floor[];
}


/* ----- api/v1/scenes ----- */
export type Geometry = [x: number, y: number, z?: number];

export interface Room {
  id: string;
  name: string;
  points: Geometry[];
}

export interface Beacon {
  name: string;
  id?: string;
  type?: string;
  x: number;
  y: number;
  z?: number;
}

export interface Floor {
  kind: "floor" | "template";
  name?: string;

  floorId: string;
  sceneId: ItemId;

  heightFrom?: number;
  heightTo?: number;

  beacons?: Beacon[];
}

export interface Scene extends Base {
  type: "2d" | "3d";
  file: ItemId;
  props?: Record<string, string>;
}


/* ----- api/v1/roles ----- */
export interface Role extends Base {
  credentials: string[];
}


/* ----- api/v1/groups ----- */
export interface Group extends Base {
  role: ItemId;

  tagname: string;
  license?: ItemId;
}


/* ----- api/v1/users ----- */
export interface User extends Base {
  role: ItemId;

  /** 
    @validate required, unique
  */
  email: string;

  /** 
    @validate required, unique, alphanumeric, min:4, max:40
  */
  login: string;

  /* not stored in db and logs */
  password?: string;

  phone: string;
  locale: string;
  timezoneOffset: number;
}


/* ----- api/v1/index ----- */
export interface WellKnown {
  base: Base;

  models: Model;
  objects: RicObject;

  events: Event;

  geofences: Geofence;
  scenes: Scene;

  roles: Role;
  groups: Group;
  users: User;
}




/* ----- client lib ----- */
// @ts-ignore
// deno-lint-ignore-file

// ignore TS2580
declare var require: any;

export const VERSION = "v1";
export const DEFAULT_BASE_URL = "https://dev.rightech.io/";

export type DeprecatedResponseV1 = {
  codes: string[];
  success: boolean;
};

export type DeprecatedResponseV2 = {};
export type DeprecatedResponse = DeprecatedResponseV1 & DeprecatedResponseV2;

export type ApiErrorHelper = {
  message: string;
  links?: string[];
};

export type RequestOptions<T = unknown> = {
  url: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: T;
};

function unique<T = unknown>(array: T[] = []) {
  return array.filter((item, pos, self) => {
    return self.indexOf(item) === pos;
  });
}

export interface ApiError extends Error {
  url: string;
  code: number;
  tags: string[];
  helper: ApiErrorHelper;
}

export class ApiError extends Error implements ApiError {
  url: string = "";
  verb: string = "GET";
  tags: string[] = [];
  code = 500;
  helper = {} as ApiErrorHelper;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error["captureStackTrace"] === "function") {
      Error["captureStackTrace"](this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }

  withTags(tags: string[] = []) {
    this.tags = unique([...this.tags, ...(tags || [])]);
    if (this.tags.length) {
      this.message = `${this.message} with tags [${this.tags}]`;
    }
    return this;
  }

  withHelper(helper: ApiErrorHelper) {
    this.helper = { ...this.helper, ...(helper || {}) };
    if (this.helper && this.helper.message) {
      this.message = `${this.message}. ${this.helper.message}`;
    }
    return this;
  }

  withVerb(verb = "GET") {
    this.verb = verb;
    return this;
  }

  withCode(code: number) {
    this.code = +code;
    this.message = `${this.code}: ${this.message}`;
    return this;
  }

  withUrl(url: string) {
    this.url = url;
    this.message = `${this.message} for ${this.verb.toUpperCase()} ${this.url}`;
    return this;
  }

  static fromJson(opts: RequestOptions, json: ApiError, statusCode = 500) {
    return new ApiError(json.message)
      .withCode(statusCode)
      .withHelper(json.helper)
      .withVerb(opts.method)
      .withUrl(opts.url)
      .withTags(json.tags);
  }
}

export class NginxError extends ApiError {
  static fromHtml(opts: RequestOptions, resp = "", statusCode = 500) {
    let [, title = "Unknown nginx errror"] =
      /<title>(.*?)<\/title>/gi.exec(resp) || [];
    title = title.replace(statusCode.toString(), "").trim();

    return new NginxError(title)
      .withCode(statusCode)
      .withVerb(opts.method)
      .withUrl(opts.url);
  }
}

export function nodeReq<Q = unknown, S = unknown>(
  opts: RequestOptions<Q>
): Promise<S> {
  const { protocol, hostname, port, pathname, search } = new URL(opts.url);

  const proto = protocol === "https:" ? require("https") : require("http");

  const options = {
    method: "GET",
    host: hostname,
    port: +port,
    path: `${pathname}${search}`,
    ...opts,
  };

  if (!port) {
    options.port = protocol === "https:" ? 443 : 80;
  }

  return new Promise((resolve, reject) => {
    const req = proto.request(
      options,
      (res: EventEmitter0 & { statusCode: number }) => {
        let resp = "";
        res.on("data", (chunk: string) => (resp += chunk.toString()));
        res.on("end", () => {
          try {
            /*
             * most nginx upstream errors should be handled by ingress default-backend
             * but who knows ...
             */
            if (resp.startsWith("<html>") && resp.includes("nginx")) {
              return reject(NginxError.fromHtml(opts, resp, res.statusCode));
            }
            const json = JSON.parse(resp);
            if (res.statusCode >= 400) {
              return reject(ApiError.fromJson(opts, json, res.statusCode));
            }
            resolve(json);
          } catch (err) {
            console.log(resp);
            reject(err);
          }
        });
      }
    );

    req.on("error", (err: unknown) => reject(err));

    if (opts.body) {
      let send = opts.body as any;
      if (typeof send === "object") {
        send = JSON.stringify(opts.body);
      }
      req.write(send);
    }
    req.end();
  });
}

function tryGetFetch(): (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response> {
  try {
    return require("node-fetch");
  } catch (_) {
    return (globalThis as any)["fetch"] as any;
  }
}

class EventEmitter0 {
  registry: Record<string, Function[]> = {};

  on<T>(event: string, handler: (data: T) => void) {
    if (!this.registry[event]) {
      this.registry[event] = [];
    }
    this.registry[event].push(handler);
    return handler;
  }
  emit<T>(event: string, data?: T) {
    if (!this.registry[event]) {
      this.registry[event] = [];
    }
    this.registry[event].forEach((handler) => handler(data));
  }
}

function read(response: ReadableStream<Uint8Array>) {
  let cancellationToken: { cancel: () => void };
  let cancellationRequest = false;

  const events = new EventEmitter0();
  const stream = new ReadableStream({
    start(controller) {
      const reader = response.getReader();
      cancellationToken = reader;

      const decoder = new TextDecoder();
      let buf = "";
      let totalBytes = 0;

      reader
        .read()
        .then(function processResult(result): any {
          if (result.done) {
            if (cancellationRequest) {
              return;
            }

            buf = buf.trim();
            if (buf.length !== 0) {
              try {
                controller.enqueue(JSON.parse(buf));
              } catch (e) {
                controller.error(e);
                return;
              }
            }
            controller.close();
            return;
          }

          const data = decoder.decode(result.value, { stream: true } as any);
          buf += data;
          totalBytes += buf.length;

          const stats = { bytes: buf.length, totalBytes };
          const lines = buf.split("\n");
          let batch = [];
          let l = "";

          for (let i = 0; i < lines.length - 1; ++i) {
            l = lines[i].trim();
            if (l === "[") {
              events.emit("start");
              continue;
            }
            if (l === ",") {
              continue;
            }

            if (l.length > 0 && l !== "]") {
              try {
                const line = JSON.parse(l);
                controller.enqueue(line);
                batch.push(line);
              } catch (e) {
                controller.error(e);
                cancellationRequest = true;
                reader.cancel();
                return;
              }
            }
          }
          buf = lines[lines.length - 1];
          events.emit("batch", { batch, stats });

          if (l === "]") {
            events.emit("end");
          }

          return reader
            .read()
            .then(processResult)
            .catch((err) => {
              cancellationRequest = true;
              events.emit("cancel");
              return false;
            });
        })
        .catch((err) => {
          cancellationRequest = true;
          cancellationToken.cancel();
        });
    },
    cancel(reason) {
      events.emit("cancel");
      cancellationRequest = true;
      cancellationToken.cancel();
    },
  });

  async function readAll() {
    const reader = stream.getReader();
    const data = [];

    let result: any;

    while (!result || !result.done) {
      result = await reader.read();
      if (result.value) {
        data.push(result.value);
      }
    }
    return data;
  }

  return { stream, events, readAll };
}

export async function req<Q = unknown, S = unknown>(
  opts: RequestOptions<Q>
): Promise<S> {
  const _fetch = tryGetFetch();

  if (typeof _fetch !== "function") {
    return nodeReq(opts);
  }

  const fetchOpts = {
    headers: opts.headers,
    method: opts.method || "GET",
    body: <any>null,
  };

  if (opts.body) {
    fetchOpts.body = opts.body;
    if (typeof fetchOpts.body === "object") {
      fetchOpts.body = JSON.stringify(fetchOpts.body);
    }
  }

  const resp = await _fetch(opts.url, fetchOpts);
  const text = await resp.text();

  if (text.startsWith("<html>") && text.includes("nginx")) {
    throw NginxError.fromHtml(opts, text, resp.status);
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw ApiError.fromJson(opts, err as ApiError, resp.status);
  }
  if (resp.status >= 400) {
    throw ApiError.fromJson(opts, json, resp.status);
  }
  return json;
}

function nodeReadStream(stream: any) {
  const JSONStream = require("JSONStream");
  const events = new EventEmitter0();

  const s0 = JSONStream.parse();
  const s1 = stream.pipe(s0);

  let totalBytes = 0;

  stream.on("data", (data: string) => {
    totalBytes += data.length;
    const stats = { bytes: data.length, totalBytes };
    events.emit("batch", { stats });
  });

  stream.on("end", () => {
    events.emit("end");
  });

  return {
    events,
    stream: s1,
  };
}

export async function reqReader<Q = unknown, S = unknown>(
  opts: RequestOptions<Q>
): Promise<StreamReader<S>> {
  const _fetch = tryGetFetch();

  if (typeof _fetch !== "function") {
    throw new Error("readable stream available for fetch api only");
  }

  const resp = await _fetch(opts.url, {
    headers: opts.headers,
    method: opts.method || "GET",
    body: <any>opts.body || null,
  });

  if (resp.status >= 400) {
    throw ApiError.fromJson(opts, await resp.json(), resp.status);
  }

  if (typeof ReadableStream === "undefined") {
    return nodeReadStream(resp.body);
  }

  return read(resp.body!);
}

export interface ClientOpts {
  url?: string;
  token?: string;
}

export interface StreamReader<T = unknown> {
  events: EventEmitter0;
  stream: ReadableStream<T>;
  readAll?: () => Promise<T[]>;
}

type Split<S extends string, D extends string> = string extends S
  ? string[]
  : S extends ""
  ? []
  : S extends `${infer T}${D}${infer U}`
  ? [T, ...Split<U, D>]
  : [S];

type WellKnownGet<TProp> = TProp extends keyof WellKnown
  ? WellKnown[TProp]
  : WellKnown["/"];

export interface WellKnown {
  ["/"]: any;
  [""]: any;
}

export interface MoreTypedClient {
  get<P extends string = "/", T = WellKnownGet<Split<P, "/">[0]>>(
    path: P
  ): Promise<T[]>;

  post<
    P extends string = "/",
    T = WellKnownGet<Split<P, "/">[0]>,
    U = Partial<T>
  >(
    path: P,
    data: U
  ): Promise<T>;

  patch<
    P extends string = "/",
    T = WellKnownGet<Split<P, "/">[0]>,
    U = Partial<T>
  >(
    path: P,
    data: U
  ): Promise<T>;

  delete<P extends string = "/", T = WellKnownGet<Split<P, "/">[0]>>(
    path: P
  ): Promise<T>;
}

export interface Client {
  new (opts?: ClientOpts): Client;

  get<T = unknown>(path: string): Promise<T[]>;
  post<T = unknown>(path: string, data: Partial<T>): Promise<T>;
  patch<T = unknown>(path: string, data: Partial<T>): Promise<T>;
  delete<T = unknown>(path: string): Promise<T>;
}

export class Client implements Client {
  _opts: ClientOpts;
  url: string;
  token: string;

  constructor(opts: ClientOpts) {
    this._opts = { ...(opts || {}) };

    this.url = this._opts.url!;
    this.token = this._opts.token!;
  }

  getHeaders() {
    const defaults: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": `rightech/rest-api client 1.1`,
    };
    if (this.token) {
      defaults.authorization = `Bearer ${this.token}`;
    }
    return defaults;
  }

  resolveUrl(path: string) {
    if (path.startsWith("/")) {
      path = path.replace("/", "");
    }
    if (!path.startsWith(`api/${VERSION}`)) {
      path = `api/${VERSION}/${path}`;
    }
    const url = new URL(path, this.url);
    return url;
  }

  get<T = unknown>(path: string): Promise<T> {
    const url = this.resolveUrl(path);
    const headers = this.getHeaders();

    if (!("ric-stream-hint" in headers)) {
      headers["ric-stream-hint"] = "yes";
    }

    return req({
      method: "GET",
      url: url.toString(),
      headers,
    });
  }

  post<T = unknown>(path: string, data: Partial<T> = {}): Promise<T> {
    return req({
      method: "POST",
      url: this.resolveUrl(path).toString(),
      headers: this.getHeaders(),
      body: data,
    });
  }

  patch<T = unknown>(path: string, data: Partial<T> = {}): Promise<T> {
    return req({
      method: "PATCH",
      url: this.resolveUrl(path).toString(),
      headers: this.getHeaders(),
      body: data,
    });
  }

  delete<T = unknown>(path: string): Promise<T> {
    return req({
      method: "DELETE",
      url: this.resolveUrl(path).toString(),
      headers: this.getHeaders(),
    });
  }

  with(opts: ClientOpts = {}) {
    return new Client({ ...(this._opts || {}), ...opts });
  }

  /* ↓ not part of api right now */

  read<T = unknown>(path: string): Promise<StreamReader<T>> {
    const url = this.resolveUrl(path);
    url.searchParams.set("streamed", "true");
    url.searchParams.set("nolimit", "true");

    const headers = this.getHeaders();
    return reqReader({ url: url.toString(), method: "GET", headers });
  }
}

export function getDefaultClient(opts?: ClientOpts): MoreTypedClient & Client {
  const maybeNode = (globalThis as any)["process"] as any;
  if (maybeNode && maybeNode.env) {
    return new Client({
      url: opts?.url ?? maybeNode.env["RIC_URL"] ?? DEFAULT_BASE_URL,
      token: opts?.token ?? maybeNode.env["RIC_TOKEN"],
    });
  }
  const maybeDeno = (globalThis as any)["Deno"] as any;
  if (maybeDeno && maybeDeno.env) {
    return new Client({
      url: opts?.url ?? maybeDeno.env.get("RIC_URL") ?? DEFAULT_BASE_URL,
      token: opts?.token ?? maybeDeno.env.get("RIC_TOKEN"),
    });
  }
  const maybeLocation = (globalThis as any)["location"] as any;
  if (maybeLocation && maybeLocation.origin) {
    return new Client({
      url: opts?.url ?? maybeLocation.origin,
    });
  }

  return new Client({ url: DEFAULT_BASE_URL });
}

export default getDefaultClient();



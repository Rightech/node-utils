// @ts-ignore
// deno-lint-ignore-file

// ignore TS2580
declare var require: any;

export const VERSION = "v1";

export const CODES: Record<string, string> = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "103": "Early Hints",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a Teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Unordered Collection",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required",
};

export interface ApiResponse {
  success: boolean;
}

export type ApiErrorHelper = {
  message?: string;
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

export class ApiError extends Error {
  jti: string = "";
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
    //this.trySetTokenId();
  }

  trySetTokenId() {
    // const [, b64] = (getToken() || '').split('.');
    // if (b64) {
    //   try {
    //     // TODO: move to ./base64.ts decode
    //     const payload = Buffer.from(b64, 'base64').toString();
    //     this.jti = JSON.parse(payload).jti || '';
    //   } catch (err) {}
    // }
  }

  withTags(tags: string[] = []) {
    this.tags = unique([...this.tags, ...(tags || [])]);
    if (this.tags.length) {
      this.message = `${this.message} with tags [${this.tags}]`;
    }
    return this;
  }

  withHelper(helper: ApiErrorHelper) {
    this.helper = helper;
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
      .withHelper(json.helper || {})
      .withVerb(opts.method)
      .withUrl(opts.url)
      .withTags(json.tags);
  }
}

export class NginxError extends ApiError {
  title: any = "";

  withTitle(title = "") {
    this.title = title;
    if (this.title) {
      this.message = `${this.message}. ${this.title}`;
    }
    return this;
  }

  static fromHtml(opts: RequestOptions, resp = "", statusCode = 500) {
    let [, title = "Unknown nginx errror"] =
      /<title>(.*?)<\/title>/gi.exec(resp) || [];
    title = title.replace(statusCode.toString(), "").trim();

    return new NginxError(CODES[statusCode])
      .withCode(statusCode)
      .withTitle(title)
      .withVerb(opts.method)
      .withUrl(opts.url);
  }
}

export function nodeReq<Q = unknown, S = unknown>(
  opts: RequestOptions<Q>
): Promise<S> {
  const { protocol, hostname, port, pathname } = new URL(opts.url);

  const proto = protocol === "https:" ? require("https") : require("http");

  const options = {
    method: "GET",
    host: hostname,
    port: +port,
    path: pathname,
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

function tryGetFetch() {
  try {
    return require("node-fetch");
  } catch (_) {
    return fetch;
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

  return read(resp.body);
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
export class Client {
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
    if (!url.searchParams.has("streamed")) {
      url.searchParams.set("streamed", "true");
    }
    return req({
      method: "GET",
      url: url.toString(),
      headers: this.getHeaders(),
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

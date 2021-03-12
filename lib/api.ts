import { unique } from './misc';
import statusCodes from './codes';

export type ItemId = string;

export interface ApiResponse {
  success: boolean;
}

export interface BaseItem extends ApiResponse {
  _id?: ItemId;

  name?: string;
  description?: string;

  owner?: ItemId;
  group?: ItemId;

  time?: number;
  _at?: number;
}

export type ApiErrorHelper = {
  message?: string;
  links?: string[];
};

export type KVM = { [k: string]: string };

export type RequestOptions<T = unknown> = {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: KVM;
  body?: T;
};

export class ApiError extends Error {
  jti: string = '';
  url: string = '';
  tags: string[] = [];
  code = 500;
  helper = {} as ApiErrorHelper;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error['captureStackTrace'] === 'function') {
      Error['captureStackTrace'](this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
    this.trySetTokenId();
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
    return this;
  }

  withHelper(helper: ApiErrorHelper) {
    this.helper = helper;
    return this;
  }

  withCode(code: number) {
    this.code = +code;
    return this;
  }

  withUrl(url: string) {
    this.url = url;
    return this;
  }

  static fromJson(opts: RequestOptions, json: ApiError, statusCode = 500) {
    return new ApiError(json.message)
      .withCode(statusCode)
      .withTags(json.tags)
      .withUrl(opts.url);
  }
}

export class NginxError extends ApiError {
  title: any = '';

  withTitle(title = '') {
    this.title = title;
    return this;
  }

  static fromHtml(opts: RequestOptions, resp = '', statusCode = 500) {
    let [, title = 'Unknown nginx errror'] = /<title>(.*?)<\/title>/gi.exec(resp) || [];
    title = title.replace(statusCode.toString(), '').trim();

    return new NginxError(statusCodes[statusCode])
      .withCode(statusCode)
      .withTitle(title)
      .withUrl(opts.url);
  }
}

export function nodeReq<Q = unknown, S = unknown>(opts: RequestOptions<Q>): Promise<S> {
  const { protocol, hostname, port, pathname } = new URL(opts.url);

  const proto = protocol === 'https:' ? require('https') : require('http');

  const options = {
    method: 'GET',
    host: hostname,
    port: +port,
    path: pathname,
    ...opts
  };

  if (!port) {
    options.port = protocol === 'https:' ? 443 : 80;
  }

  return new Promise((resolve, reject) => {
    const req = proto.request(options, (res) => {
      let resp = '';
      res.on('data', (chunk) => (resp += chunk.toString()));
      res.on('end', () => {
        try {
          /*
           * most nginx upstream errors should be handled by ingress default-backend
           * but who knows ...
           */
          if (resp.startsWith('<html>') && resp.includes('nginx')) {
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
    });

    req.on('error', (err) => reject(err));

    if (opts.body) {
      let send = opts.body as any;
      if (typeof send === 'object') {
        send = JSON.stringify(opts.body);
      }
      req.write(send);
    }
    req.end();
  });
}

export async function req<Q = unknown, S = unknown>(opts: RequestOptions<Q>): Promise<S> {
  if (typeof fetch !== 'function') {
    return nodeReq(opts);
  }

  const resp = await fetch(opts.url, {
    headers: opts.headers,
    method: opts.method || 'GET',
    body: <any>opts.body || null
  });

  const json = await resp.json();

  if (resp.status >= 400) {
    throw ApiError.fromJson(opts, json, resp.status);
  }

  return json;
}

export interface ClientOpts {
  url?: string;
  token?: string;
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

  getDefaultHeaders() {
    const defaults: KVM = {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': `npm:@rightech/utils 1.1`
    };
    if (this.token) {
      defaults.authorization = `Bearer ${this.token}`;
    }
    return defaults;
  }

  get<T = unknown>(path: string, query = {}): Promise<T> {
    const url = new URL(path, this.url);
    const headers = this.getDefaultHeaders();
    return req({ url: url.toString(), method: 'GET', headers });
  }

  post<T = unknown>(path: string, data: Partial<T> = {}): Promise<T> {
    const url = new URL(path, this.url);
    const headers = this.getDefaultHeaders();
    return req({ url: url.toString(), method: 'POST', headers, body: data });
  }

  patch<T = unknown>(path: string, data: Partial<T> = {}): Promise<T> {
    const url = new URL(path, this.url);
    const headers = this.getDefaultHeaders();
    return req({ url: url.toString(), method: 'PATCH', headers, body: data });
  }

  delete<T = unknown>(path: string): Promise<T> {
    const url = new URL(path, this.url);
    const headers = this.getDefaultHeaders();
    return req({ url: url.toString(), method: 'DELETE', headers });
  }

  with(opts: ClientOpts = {}) {
    return new Client({ ...(this._opts || {}), ...opts });
  }
}

export default new Client({
  url: process.env['RIC_URL'] || 'https://dev.rightech.io/',
  token: process.env['RIC_TOKEN']
});

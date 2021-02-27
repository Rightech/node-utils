//import { resolve, parse } from "url";
//import { join } from "path";

import { unique } from './misc.ts';

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
}

export class NginxError extends ApiError {
  title: any = '';

  withTitle(title = '') {
    this.title = title;
    return this;
  }

  static fromHtml(resp = '', statusCode = 500) {
    let [, title = 'Unknown nginx errror'] = /<title>(.*?)<\/title>/gi.exec(resp) || [];
    title = title.replace(statusCode.toString(), '').trim();

    // return new NginxError(http.STATUS_CODES[statusCode])
    //   .withCode(statusCode)
    //   .withTitle(title);
  }
}

type KVM = { [k: string]: string };

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: KVM;
}

export async function req<T, U = unknown>(
  url: string,
  opts: RequestOptions = {},
  data?: U
) {
  const resp = await fetch(url, {
    ...opts
  });

  const json = await resp.json();

  console.log('.xxx', resp.status);

  if (resp.status >= 300) {
    throw new ApiError(json.message)
      .withHelper(json.helper)
      .withTags(json.tags)
      .withCode(resp.status)
      .withUrl(url);
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
    return req(url.toString(), { method: 'GET', headers });
  }

  post<T = unknown>(path: string, data: Partial<T> = {}): Promise<T> {
    const url = new URL(path, this.url);
    const headers = this.getDefaultHeaders();
    return req(url.toString(), { method: 'POST', headers }, data);
  }

  patch<T = unknown>(path: string, data: Partial<T> = {}): Promise<T> {
    const url = new URL(path, this.url);
    const headers = this.getDefaultHeaders();
    return req(url.toString(), { method: 'PATCH', headers }, data);
  }

  delete<T = unknown>(path: string): Promise<T> {
    const url = new URL(path, this.url);
    const headers = this.getDefaultHeaders();
    return req(url.toString(), { method: 'DELETE', headers });
  }

  with(opts: ClientOpts = {}) {
    return new Client({ ...(this._opts || {}), ...opts });
  }
}

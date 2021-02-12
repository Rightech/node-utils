const { resolve, parse } = require('url');
const { join } = require('path');

const http = require('http');
const https = require('https');

const { unique } = require('./filter');

class ApiError extends Error {
  constructor(message) {
    super(message);

    this.jti = '';
    this.url = '';
    this.tags = [];
    this.code = 500;

    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
    this.trySetTokenId();
  }

  trySetTokenId() {
    const [, b64] = (getToken() || '').split('.');
    if (b64) {
      try {
        const payload = Buffer.from(b64, 'base64').toString();
        this.jti = JSON.parse(payload).jti || '';
      } catch (err) {}
    }
  }

  withTags(tags = []) {
    this.tags = unique([...this.tags, ...(tags || [])]);
    return this;
  }

  withCode(code) {
    this.code = +code;
    return this;
  }

  withUrl(url) {
    this.url = url;
    return this;
  }
}

class NginxError extends ApiError {
  constructor() {
    super(...arguments);
    this.title = '';
  }

  withTitle(title = '') {
    this.title = title;
    return this;
  }

  static fromHtml(resp = '', statusCode = 500) {
    let [, title = 'Unknown nginx errror'] = /<title>(.*?)<\/title>/gi.exec(resp) || [];
    title = title.replace(statusCode.toString(), '').trim();
    return new NginxError(http.STATUS_CODES[statusCode])
      .withCode(statusCode)
      .withTitle(title);
  }
}

function req(url, opts = {}, data = null) {
  const { protocol, hostname, port, path } = parse(url);
  console.log({ protocol, hostname, port, path })

  const proto = protocol === 'https:' ? https : http;

  opts = {
    method: 'GET',
    host: hostname,
    port: +port,
    path,
    ...opts
  };

  if (!port) {
    opts.port = protocol === 'https:' ? 443 : 80;
  }

  return new Promise((resolve, reject) => {
    const req = proto.request(opts, (res) => {
      let resp = '';
      res.on('data', (chunk) => (resp += chunk.toString()));
      res.on('end', () => {
        try {
          /*
           * most nginx upstream errors should be handled by ingress default-backend
           * but who knows ...
           */
          if (resp.startsWith('<html>') && resp.includes('nginx')) {
            return reject(NginxError.fromHtml(resp, res.statusCode).withUrl(url));
          }
          const json = JSON.parse(resp);
          if (res.statusCode >= 400) {
            return reject(
              new ApiError(json.message)
                .withCode(res.statusCode)
                .withTags(json.tags)
                .withUrl(url)
            );
          }
          resolve(json);
        } catch (err) {
          console.log(resp);
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      let send = data;
      if (typeof data === 'object') {
        send = JSON.stringify(data);
      }
      req.write(send);
    }
    req.end();
  });
}

class ApiClient {
  constructor(opts) {
    const { url, token } = opts || {};

    this._opts = opts;
    this.url = url;
    this.token = token;
  }

  getDefaultHeaders() {
    const defaults = {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': `npm:@rightech/utils 1.1`
    };
    if (this.token) {
      defaults.authorization = `Bearer ${this.token}`;
    }
    return defaults;
  }

  get(path, query = {}) {
    const url = resolve(this.url, path);
    const headers = this.getDefaultHeaders();
    return req(url, { method: 'GET', headers });
  }

  post(path, data = {}) {
    const url = resolve(this.url, path);
    const headers = this.getDefaultHeaders();
    return req(url, { method: 'POST', headers }, data);
  }

  patch(path, data = {}) {
    const url = resolve(this.url, path);
    const headers = this.getDefaultHeaders();
    return req(url, { method: 'PATCH', headers }, data);
  }

  delete(path) {
    const url = resolve(this.url, path);
    const headers = this.getDefaultHeaders();
    return req(url, { method: 'DELETE', headers });
  }

  with(opts = {}) {
    return new ApiClient({ ...(this._opts || {}), ...opts });
  }
}

module.exports = new ApiClient({
  url: process.env['RIC_URL'] || 'https://dev.rightech.io/',
  token: process.env['RIC_TOKEN']
});

import { Readable } from 'node:stream';
import { handleApi } from '../lib/handler.js';

/**
 * Adapt the shared Node-style API handler to Vercel's standard Web Request API.
 * This keeps one implementation of validation, sessions and business logic
 * for both `node server.js` and Vercel Functions.
 */
async function dispatch(request) {
  const url = new URL(request.url);
  const bytes = request.method === 'GET' || request.method === 'HEAD'
    ? Buffer.alloc(0)
    : Buffer.from(await request.arrayBuffer());

  const req = Readable.from(bytes.length ? [bytes] : []);
  req.method = request.method;
  req.url = `${url.pathname}${url.search}`;
  req.headers = Object.fromEntries(request.headers.entries());

  let statusCode = 200;
  let responseBody = null;
  const responseHeaders = new Headers();
  const res = {
    writeHead(status, headers = {}) {
      statusCode = status;
      for (const [name, value] of Object.entries(headers)) {
        if (value !== undefined && value !== null) responseHeaders.set(name, String(value));
      }
      return this;
    },
    setHeader(name, value) {
      responseHeaders.set(name, String(value));
      return this;
    },
    end(body = null) {
      responseBody = body;
    }
  };

  await handleApi(req, res);
  return new Response(responseBody, { status: statusCode, headers: responseHeaders });
}

export default { fetch: dispatch };

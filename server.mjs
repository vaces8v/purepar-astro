import { createServer } from 'http';
import { handler as ssrHandler } from './dist/server/entry.mjs';
import compression from 'compression';

const compressionMiddleware = compression();

const server = createServer((req, res) => {
  compressionMiddleware(req, res, () => {
    ssrHandler(req, res);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOSTNAME || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server with compression listening on http://${HOST}:${PORT}`);
});

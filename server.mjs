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
server.listen(PORT, () => {
  console.log(`Server with compression listening on http://localhost:${PORT}`);
});

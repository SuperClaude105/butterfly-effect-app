import http from 'http';
import { createReadStream, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json'
};

http.createServer((req, res) => {
  let filePath = join(__dirname, req.url === '/' ? 'index.html' : req.url);
  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) filePath = join(filePath, 'index.html');
    const type = mime[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => console.log(`Serving at http://localhost:${PORT}`));

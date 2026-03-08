import * as http from 'http';
import * as fs from 'fs';
import { logger } from '../utils/logger';

export function startPreviewServer(htmlPath: string, port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      if (!fs.existsSync(htmlPath)) {
        res.writeHead(404);
        res.end('Report not found. Run `qa-dash report --reporter html` first.');
        return;
      }

      const content = fs.readFileSync(htmlPath, 'utf-8');
      const autoReload = `
<script>
(function() {
  let lastModified = '';
  setInterval(async () => {
    try {
      const res = await fetch('/__check');
      const mtime = await res.text();
      if (lastModified && mtime !== lastModified) location.reload();
      lastModified = mtime;
    } catch {}
  }, 2000);
})();
</script>`;

      const html = content.replace('</body>', `${autoReload}\n</body>`);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } else if (req.url === '/__check') {
      try {
        const stat = fs.statSync(htmlPath);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(stat.mtimeMs.toString());
      } catch {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('0');
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    logger.info(`Dashboard preview: http://localhost:${port}`);
  });

  return server;
}

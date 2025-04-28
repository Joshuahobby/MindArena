const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Default to index.html
  let filePath = path.join(__dirname, 'web', req.url === '/' ? 'index.html' : req.url);
  
  // Get the file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  
  // Define MIME types
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf'
  };

  // Set the content type based on MIME type
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found
        fs.readFile(path.join(__dirname, 'web', 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
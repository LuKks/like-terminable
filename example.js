const terminable = require('./index.js');
const http = require('http');

const server = http.createServer((req, res) => {
  const timeoutId = setTimeout(() => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: 'Hello World!'
    }));
  }, 3000);

  // optional:
  terminable.find(res).once('cleanup', function () {
    clearTimeout(timeoutId);
    res.end();
  });
});

server.listen(8000, function () {
  terminable.add(server);
});

console.log('Press CTRL+C to gracefully close the server and twice to force SIGINT');

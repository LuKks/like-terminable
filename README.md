# like-terminable

Handle resources like process, cluster, servers and req/res for graceful exit

![](https://img.shields.io/npm/v/like-terminable.svg) ![](https://img.shields.io/npm/dt/like-terminable.svg) ![](https://img.shields.io/github/license/LuKks/like-terminable.svg)

```javascript
const terminable = require('like-terminable');
const express = require('express');

const app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/long-polling', function (req, res) {
  const timeoutId = setTimeout(() => {
    res.send('Hello World!');
  }, 3000);

  // optional:
  terminable.find(res).once('cleanup', function () {
    clearTimeout(timeoutId);
    res.end();
  });
});

const server = app.listen(3000, function () {
  terminable.add(server);
});

console.log('Press CTRL+C to gracefully close the server and twice to force SIGINT');
```

## Install
```
npm i like-terminable
```

## License
Code released under the [MIT License](https://github.com/LuKks/like-terminable/blob/master/LICENSE).

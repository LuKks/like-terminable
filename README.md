# like-terminable

Handle process, cluster, servers and req/res for graceful exit

![](https://img.shields.io/npm/v/like-terminable.svg) ![](https://img.shields.io/npm/dt/like-terminable.svg) ![](https://img.shields.io/github/license/LuKks/like-terminable.svg)

Supports cluster, process events, SIGTERM, SIGINT, SIGHUP, etc.\
`server.close()` and `keep-alive` done right at socket level.

```javascript
const terminable = require('like-terminable')
const express = require('express')

const app = express()

app.get('/', function (req, res) {
  res.send('Hello World!')
})

const server = app.listen(3000, function () {
  terminable.add(server) // always add it after 'listening' event
})

console.log('Press CTRL+C to clean up the process, twice forces SIGINT')
```

## Install
```
npm i like-terminable
```

## Examples
#### 'cleanup' event
```javascript
app.get('/long-polling', function (req, res) {
  const timeoutId = setTimeout(() => {
    res.send('Hello World!')
  }, 3000)

  terminable.find(res).once('cleanup', function () {
    clearTimeout(timeoutId)
    res.end()
  })
})
```

Note: 'cleanup' event could be emitted multiple times,\
be aware of `on('cleanup', ..)` vs `once('cleanup', ..)`.

#### 'cleanup' state
```javascript
app.get('/long-processing', function (req, res) {
  const state = terminable.find(res)

  while (true) {
    if (state.terminated) {
      res.end()
      return
    }

    if (Math.random() > 0.9999) {
      res.json({ processed: true })
      return
    }
  }
})
```

#### How to close the server without terminating the process?
```javascript
const server = app.listen(3000, function () {
  const state = terminable.add(server)

  // ie. close the server and clean up all the resources under server:
  state.cleanup()
})
```

#### How to manually clean up the process?
```javascript
const server = app.listen(3000, function () {
  terminable.add(server)

  // ie. clean up all the resources under process after 3 seconds
  setTimeout(function () {
    terminable.cleanup()
  }, 3000)
})
```

## License
Code released under the [MIT License](https://github.com/LuKks/like-terminable/blob/master/LICENSE).

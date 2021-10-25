/*
 like-terminable (https://npmjs.com/package/like-terminable)
 Copyright 2021 Lucas Barrena
 Licensed under MIT (https://github.com/LuKks/like-terminable)
*/

'use strict'

const Terminable = require('terminable')
const cluster = require('cluster')

// single state to shareable across the process
const terminable = new Terminable()

// automatic support for types
terminable._add = function (resource) {
  const type = resource.constructor.name
  if (type === 'process') {
    addProcess.call(this, resource)
  }
}

const state = terminable.add(process)

module.exports = state

state._find = function (resource) {
  const type = resource.constructor.name
  if (type === 'ServerResponse') {
    return findResponse.call(this, resource)
  }
}

function findResponse (res) {
  return this.get(res.socket.server).get(res.socket).get(res)
}

// automatic support for types
state._add = function (resource) {
  const type = resource.constructor.name
  if (type === 'Server') {
    addServer.call(this, resource)
  } else if (type === 'Socket') {
    addSocket.call(this, resource)
  } else if (type === 'ServerResponse') {
    addResponse.call(this, resource)
  }
}

// + should optimize for reusing _add

function addProcess (process0) {
  const state = this.get(process0)

  state.cb = onCleanup
  state.on('cleanup', state.cb)

  // clean up all the states on these events
  process0.once('SIGTERM', () => {
    if (!this.terminated) {
      if (cluster.isWorker) {
        try {
          cluster.worker.disconnect()
        } catch (err) {}
      }
    }

    this.cleanup()
  })
  process0.once('SIGINT', () => this.cleanup())
  process0.once('SIGHUP', () => this.cleanup())
  process0.once('disconnect', () => this.cleanup())

  process0.on('exit', (code) => {
    process.exitCode = code
    this.cleanup()
  })
  process0.on('uncaughtException', (err, origin) => {
    console.error(err)
    this.cleanup()
  })
  process0.on('unhandledRejection', (reason, promise) => {
    console.error(reason)
    this.cleanup()
  })

  process0.once('exit', () => {
    this.delete(process0)
  })

  // check if parent is already wants to terminate
  if (this.terminated) {
    state.cleanup()
  } else if (cluster.isWorker && !process0.connected) {
    this.cleanup()
  }

  function onCleanup () {
    if (state.terminated && !state.size) {
      state.off('cleanup', state.cb)

      if (cluster.isMaster) {
        cluster.disconnect()
      } else if (cluster.isWorker) {
        // cluster.worker.disconnect();
        // + should send SIGHUP to master or it's already redirected from worker to master?
        // cluster.worker.kill();
      }

      process.kill(process.pid, 'SIGHUP')
    }
  }
}

function addServer (server) {
  const state = this.get(server)

  state.cb = onCleanup
  state.on('cleanup', state.cb)

  server.prependListener('connection', (socket) => state.add(socket))
  server.prependListener('request', (req, res) => state.get(res.socket).add(res))
  server.once('close', () => {
    this.delete(server)
  })

  // check if parent is already wants to terminate
  if (this.terminated) {
    state.cleanup()
  } else if (!server.listening) {
    this.cleanup()
  }

  function onCleanup () {
    if (state.terminated/* && !state.size */) {
      state.off('cleanup', state.cb)
      server.close()
    }
  }
}

function addSocket (socket) {
  const state = this.get(socket)
  state.cb = onCleanup
  state.on('cleanup', state.cb)

  socket.once('close', () => {
    this.delete(socket)
  })

  // try to stop accepting new connections (existing behavior)
  if (this.terminated) {
    state.cleanup()
  } else if (!socket.server.listening) {
    this.cleanup()
  }

  function onCleanup () {
    state.off('cleanup', state.cb)

    if (state.terminated && !state.size) {
      // immediately close any completely idle connections
      socket.end(function () {
        if (!socket.destroyed) {
          socket.destroy()
        }
      })
    }
  }
}

function addResponse (res) {
  const self = this

  const state = this.get(res)
  state.cb = onCleanup
  state.on('cleanup', state.cb)

  res.once('close', () => {
    this.delete(res)
  })

  if (this.terminated) {
    state.cleanup()
  } else if (!res.socket.server.listening) {
    this.cleanup()
  } else if (res.socket.destroyed) {
    this.cleanup()
  }

  function onCleanup () {
    if (state.terminated && !state.size) {
      // recommended behaviour:
      if (self.terminated && !self.size) {
        state.off('cleanup', state.cb)

        res.socket.end(function () {
          if (!res.socket.destroyed) {
            res.socket.destroy()
          }
        })
      }

      // try to stop accepting new requests on all remaining connections:
      // this can result in unexpected behaviour, also enforces checking res.headersSent and event 'finish'
      // also maybe there is no good way to really stop accepting new requests because of how node works internally
      // that's why it's useful systemd, etc they have timeouts to kill the process
      // state.off('cleanup', onCleanup)
      // res.end()
    }
  }
}

/*
 like-terminable (https://npmjs.com/package/like-terminable)
 Copyright 2021 Lucas Barrena
 Licensed under MIT (https://github.com/LuKks/like-terminable)
*/

'use strict'

module.exports = {}

module.exports._add = function (res, state) {
  const self = this

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

module.exports._find = function (res) {
  return this.get(res.socket.server).get(res.socket).get(res)
}

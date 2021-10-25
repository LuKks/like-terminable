/*
 like-terminable (https://npmjs.com/package/like-terminable)
 Copyright 2021 Lucas Barrena
 Licensed under MIT (https://github.com/LuKks/like-terminable)
*/

'use strict'

module.exports = {}

module.exports._add = function (socket, state) {
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

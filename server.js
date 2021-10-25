/*
 like-terminable (https://npmjs.com/package/like-terminable)
 Copyright 2021 Lucas Barrena
 Licensed under MIT (https://github.com/LuKks/like-terminable)
*/

'use strict'

module.exports = {}

module.exports._add = function (server, state) {
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

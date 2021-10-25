/*
 like-terminable (https://npmjs.com/package/like-terminable)
 Copyright 2021 Lucas Barrena
 Licensed under MIT (https://github.com/LuKks/like-terminable)
*/

'use strict'

const cluster = require('cluster')

module.exports = {}

module.exports._add = function (process0, state) {
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

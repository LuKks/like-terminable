/*
 like-terminable (https://npmjs.com/package/like-terminable)
 Copyright 2021 Lucas Barrena
 Licensed under MIT (https://github.com/LuKks/like-terminable)
*/

'use strict'

const Terminable = require('terminable')
const adds = {
  process: require('./process.js'),
  Server: require('./server.js'),
  Socket: require('./socket.js'),
  ServerResponse: require('./response.js')
}
const finds = {
  ServerResponse: require('./response.js')
}

const terminable = new Terminable()

terminable._add = function (resource, state, type) {
  if (adds[type]) {
    adds[type]._add.call(this, resource, state)
  }
}

terminable._find = function (resource, type) {
  if (finds[type]) {
    return finds[type]._find.call(this, resource)
  }
}

module.exports = terminable

terminable.add(process)

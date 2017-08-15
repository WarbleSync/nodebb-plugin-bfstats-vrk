'use strict';
var bfsockets = {},
controllers = require('./controllers')

bfsockets.updateStats = function(socket, data, callback){
  controllers.updateStatsSocket(function(err,result){
    // console.log(result)
    callback(null, result)
  })
}

module.exports = bfsockets;

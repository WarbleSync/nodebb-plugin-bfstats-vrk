'use strict';

var Controllers = {},
db = require.main.require('./src/database'),
meta = require.main.require('./src/meta'),
cron = require.main.require('cron').CronJob,
async = require('async'),
nconf = require('nconf'),
parser = require('cron-parser'),
_ = require('lodash'),
BattlefieldStats = require('battlefield-stats'),
cronJobs = [];

// const {PubgAPI, PubgAPIErrors} = require('pubg-api-redis')

Controllers.renderAdminPage = function (req, res, next) {
	/*
		Make sure the route matches your path to template exactly.

		If your route was:
			myforum.com/some/complex/route/
		your template should be:
			templates/some/complex/route.tpl
		and you would render it like so:
			res.render('some/complex/route');
	*/

	res.render('admin/plugins/bfstats', {});
};

Controllers.updateStatsSocket = function(callback){
	Controllers.updateStats(function(err,result){
		if(err){
			callback(err)
		}
		else{
			callback(null, result)
		}
	})
}

Controllers.updateStats = function(next){
	var settings = {}
	async.waterfall([
		function(callback){
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  UPDATE STATS START')
			callback()
		},
		function(callback){ // get pubgstats settings
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  RETRIVING BFSTATS SETTINGS')
			meta.settings.get('bfstats', function (err, results){
				settings = results
				callback()
			})
		},
		function(callback){
			settings.bf = new BattlefieldStats(settings.apiKey);
			callback()
		},
		function(callback){ //get uids
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  RETRIVING UIDS')
			db.getSortedSetRangeWithScores('username:uid', 0, -1,function(err, uids){
				if (err) return console.log(err)
				// console.log(uids)
				var userKeys = []
				uids.forEach(function(u,i){
					userKeys.push('user:' + u.score + ':ns:custom_fields')
				})
				settings['userKeys'] = userKeys
				callback()
			})
		},
		function(callback){ //get user platform info
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  RETRIVING USER PLATFORM INFORMATION')
			db.getObjects(settings.userKeys, function(err, result){
				if (err) return console.log(err)
				var users = []
				// console.dir(result)
				result.forEach(function(u,i){
					if(typeof u !== 'undefined' && u.hasOwnProperty('uplay_id')){
						if(u.uplay_id !== ''){
							users.push({
								_key: 'user:' + settings.userKeys[i].replace('user:','').replace(':ns:custom_fields','') + ':bfstats',
								uid: settings.userKeys[i].replace('user:','').replace(':ns:custom_fields',''),
								origin_id: u.origin_id,
							})
						}
					}
				})
				settings['users'] = users
				callback()
			})
		},
		function(callback){ // get users forum info
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  RETRIVING USER FORUM INFORMATION')
			var userKeys = []
			settings.users.forEach(function(u,i){
				userKeys.push('user:' + u.uid)
			})
			db.getObjects(userKeys, function(err, result){
				if (err) return console.log(err)
				async.forEachOf(result, function(user, index, cb){
					settings.users.forEach(function(u,i){
						if(user.uid == u.uid){
							settings.users[i].username = user.username
							settings.users[i].picture = user.picture
						}
					})
					cb()
				},function(err){
					callback()
				})
			})
		},
		function(callback){ // get BF1STATS
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  RETRIVING STATS START BF1')
			var bf = settings.bf
			async.forEachOf(settings.users, function(user, index, cb){

				var params = {
					platform: bf.Platforms.PC,
					displayName: user.origin_id,
					game: 'tunguska'
				}

				bf.Api.request('/Stats/BasicStats',params,(error, response) => {
					if(!error && response){
						if(response.successful){
							user.bf1stats = response.result
							user.bf1stats.rank = {
								imageUrl: response.result.rank.imageUrl.replace('[BB_PREFIX]',response.bbPrefix),
								name: response.result.rank.name
							}
						}
						cb()
					}
					else{
						cb()
					}
				})
			},function(err){
				console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  RETRIVING STATS END BF1')
				callback()
			})
		},
		function(callback){
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  RETRIVING STATS START BF4')
			var bf = settings.bf
			async.forEachOf(settings.users, function(user, index, cb){

				var params = {
					platform: bf.Platforms.PC,
					displayName: user.origin_id,
					game: 'bf4'
				}

				bf.Api.request('/Stats/BasicStats',params,(error, response) => {
					if(!error && response){
						if(response.successful){
							user.bf4stats = response.result
							user.bf4stats.rank = {
								imageUrl: response.result.rank.imageUrl.replace('[BB_PREFIX]',response.bbPrefix),
								name: response.result.rank.name
							}
						}
						cb()
					}
					else{
						cb()
					}
				})
			},function(err){
				console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  RETRIVING STATS END BF4')
				callback()
			})
		},
		function(callback){
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  SAVING STATS START')
			async.forEachOf(settings.users, function(user, index, cb){
				if(user.hasOwnProperty('bf1stats') || user.hasOwnProperty('bf4stats')){
					db.setObject(user._key,user,function(err,result){
						console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  STATS SAVED FOR  ' + settings.users[index].username + ' ')
						cb()
					})
				}
				else{
					cb()
				}
			},function(err){
				console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  SAVING STATS END')
				callback()
			})
		}
	],function(err, result){
		console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  UPDATE STATS END')
		next(null, { complete : true, users: settings.users })
	})
}

Controllers.startJobs = function(){
	var settings = {}
	async.waterfall([
		function(callback){
			meta.settings.get('bfstats', function (err, results){
				settings = results
				callback()
			})
		},
		function(callback){
			if(settings.hasOwnProperty('updateTime')){
				settings.validCron = parser.parseString(settings.updateTime)
				// console.log(_.isEmpty(settings.validCron.errors))
				callback()
			}
			else{
				return
			}
		},
		function(callback){
			settings.started = false;
			if(_.isEmpty(settings.validCron.errors) && settings.updateTime != ''){
				cronJobs.push(new cron(settings.updateTime, function(){
					Controllers.updateStats(function(err,result){
						console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  CRON RUN COMPLETE')
					})
				}, null, false));
				settings.started = true;
			}
			callback()
		},
		function(callback){
			cronJobs.forEach(function(job) {
				console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  STARTING CRON JOBS')
				job.start()
			})
			callback()
		}
	],function(err, result){
		if(settings.started){
			settings.validCron = parser.parseExpression(settings.updateTime)
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  CRON JOBS STARTED')
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  NEXT UPDATE @ ' + settings.validCron.next().toString())
		}
		else{
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  CRON JOBS NOT STARTED')
			console.log('[' + new Date().toISOString() + '][BFSTATS] 🔫  CHECK SETTINGS')
		}
	})
}

module.exports = Controllers;

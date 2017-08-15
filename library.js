"use strict";

var controllers = require('./lib/controllers'),
socketPlugins = require.main.require('./src/socket.io/plugins'),
bfsockets = require('./lib/bfsockets'),
plugin = {};

plugin.init = function(params, callback) {
	var router = params.router,
		hostMiddleware = params.middleware,
		hostControllers = params.controllers;
	// We create two routes for every view. One API call, and the actual route itself.
	// Just add the buildHeader middleware to your route and NodeBB will take care of everything for you.

	router.get('/admin/plugins/bfstats', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
	router.get('/api/admin/plugins/bfstats', controllers.renderAdminPage);
	// create socket name space
	socketPlugins.BFSTATS = bfsockets
	//schedule cron jobs
	controllers.startJobs();
	callback();
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/bfstats',
		icon: 'fa-tint',
		name: 'BFSTATS'
	});

	callback(null, header);
};

module.exports = plugin;

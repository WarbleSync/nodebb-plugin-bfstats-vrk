'use strict';
/* globals $, app, socket */

define('admin/plugins/bfstats', ['settings'], function(Settings) {

	var ACP = {};

	ACP.init = function() {
		Settings.load('bfstats', $('.bfstats-settings'));

		$('#save').on('click', function() {
			Settings.save('bfstats', $('.bfstats-settings'), function() {
				// console.log('save')
				app.alert({
					type: 'success',
					alert_id: 'bfstats-saved',
					title: 'Settings Saved',
					message: 'Please restart the forum before running update',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});

		$('#updateStats').on('click', function(){
			app.alert({
				type: 'info',
				alert_id: 'bfstats-update',
				title: 'Update Started',
				message: 'Please wait while stats are calculated'
			});
			socket.emit('plugins.BFSTATS.updateStats', {}, function (err, data) {
			  // console.log(data)
				app.alert({
					type: 'success',
					alert_id: 'bfstats-update',
					title: 'Update Complete',
					message: 'Success! Stats calculated!',
				});
			})
			return false;
		})

	};

	return ACP;
});

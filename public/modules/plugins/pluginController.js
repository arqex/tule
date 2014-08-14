var deps = [
	'jquery', 'underscore', 'backbone',

	'pageController',

	'alerts',
	'events',

	'./pluginViews',
	'text!./tpls/plugins.html'
];

define(deps,
function($,_,Backbone, PageController, Alerts, Events, PluginViews){
	'use strict';

	/**
	 * Handles the clieant route /plugins.
	 *
	 * Allows to activate and deactivate plugins.
	 */
	var PluginController = Backbone.View.extend({
		className: 'tule-plugins',
		url: '/api/plugins',

		initialize: function(){
			var me = this;

			// Fetch the installed plugins list
			this.loading = this.fetchPluginList()
				.then(function(pluginList){
					me.pluginList = pluginList;

					// Create the list view
					me.listView = new PluginViews.PluginListView({data: pluginList});

					me.listenTo(me.listView, 'activate', function(plugin){
						me.togglePlugin(plugin.id, 'activate');
					});
					me.listenTo(me.listView, 'deactivate', function(plugin){
						me.togglePlugin(plugin.id, 'deactivate');
					});
				})
				.fail(function(xhr, state, err){
					console.log(err);
					Alerts.add({
						message: 'There was an fetching the plugins data. Please, try again',
						level: 'error'
					});
				})
			;
		},

		render: function() {
			var me = this;

			this.$el.html('Loading..');

			this.loading.then(function(){
				me.$el.html(me.listView.render().el);
				me.listView.delegateEvents();
			});

			return this;
		},

		fetchPluginList: function() {
			return $.ajax(this.url);
		},

		/**
		 * Activate or deactivate a plugin.
		 *
		 * @param  {String} pluginId The plugin id.
		 * @param  {String} action   'activate'|'deactivate'
		 */
		togglePlugin: function(pluginId, action){
			$.get(this.url + '/' + action + '/' + pluginId)
				.then(function(){
					window.location.reload(true);
				})
				.fail(function(){
					Alerts.add({
						message: 'There was an error trying to ' + action + ' the plugin. Please, try again',
						level: 'error'
					});
				})
			;
		}
	});

	return PageController.extend({
		title: 'Installed Plugins',
		contentView: PluginController
	});
});
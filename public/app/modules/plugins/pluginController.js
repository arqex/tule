define(['jquery', 'underscore', 'backbone', 'pageController', './pluginModels'],
function($,_,Backbone, PageController, Plugins){

	var PluginController = PageController.extend({
		title: 'Plugins',
		tpl: '<div class="plugins"></div>',
		init: function(options){
			var me = this,
				pluginList = new Plugins.PluginList([])
			;
			pluginList.fetch().then(function(){
				me.listView = new Plugins.PluginListView({collection: pluginList});
				me.regions.content.show(me.listView);

				me.bindPluginEvents();
				me.trigger('intialized')
			});
		},
		bindPluginEvents: function(){
			var me = this;
			this.listenTo(this.listView, 'itemview:activate', function(itemView){
				me.togglePlugin(itemView.model.id, 'activate');
			});
			this.listenTo(this.listView, 'itemview:deactivate', function(itemView){
				me.togglePlugin(itemView.model.id, 'deactivate');
			});
		},
		togglePlugin: function(pluginId, action){
			$.get(this.listView.collection.url + '/' + action + '/' + pluginId)
				.then(function(){
					window.location.reload(true);
				})
				.fail(function(){
					alerter.add('There was an error trying to ' + action + ' the plugin. Please, try again', 'error');
				})
			;
		}
	});

	return PluginController;
});
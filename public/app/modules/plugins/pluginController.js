define(['jquery', 'underscore', 'backbone', 'modules/core/pageController', './pluginModels'],
function($,_,Backbone, PageController, Plugins){

	var PluginController = PageController.extend({
		title: 'Plugins',
		tpl: '<div class="plugins"></div>',
		regionViews: {},
		regions: {},
		initialize: function(options){
			var me = this,
				pluginList = new Plugins.PluginList([])
			;
			this.querying = pluginList.fetch().then(function(){
				var listView = new Plugins.PluginListView({collection: pluginList});
				me.regionViews = {'.plugins': 'list'};
				me.subViews = {list: listView};

				me.bindPluginEvents();
				me.trigger('intialized')
			});
		},
		bindPluginEvents: function(){
			var me = this;
			this.listenTo(this.subViews.list, 'itemview:activate', function(itemView){
				me.togglePlugin(itemView.model.id, 'activate');
			});
			this.listenTo(this.subViews.list, 'itemview:deactivate', function(itemView){
				me.togglePlugin(itemView.model.id, 'deactivate');
			});
		},
		togglePlugin: function(pluginId, action){
			$.get(this.subViews.list.collection.url + '/' + action + '/' + pluginId)
				.then(function(){
					window.location.reload(true);
				})
				.fail(function(){
					alert.add('There was an error trying to ' + action + ' the plugin. Please, try again', 'error');
				})
			;
		},
		render: function(){
			var me = this;
			this.querying.then(function(){
				PageController.prototype.render.apply(me, arguments)
			});
		}
	});

	return PluginController;
});
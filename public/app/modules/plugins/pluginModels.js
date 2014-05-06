var deps = [
	'jquery', 'underscore', 'backbone', 'marionette', 'text!.tpls/plugins.html'
];
define(deps, function($,_,Backbone, Marionette, tplSource){
	var tpls = $(tplSource);

	var PluginModel = Backbone.Model.extend({
		defaults: {
			name: 'Unknown Plugin',
			description: 'No description',
			version: 'Unkown',
			author: 'Unknown'
		}
	});

	var PluginList = Backbone.Collection.extend({
		model: PluginModel,
		url: '/api/plugins'
	});


	var PluginView = Marionette.ItemView.extend({
		template: function(data){
			return _.template(tpls.find('#pluginTpl').html(), data);
		},
		attributes: function(){
			return {
				'class': 'tule-plugin',
				'id': 'tule-plugin-' + this.model.id
			}
		}
	});

	var PluginListView = Marionette.CollectionView.extend({
		itemView: PluginView
	});

	return {
		PluginView:	PluginView,
		PluginListView: PluginListView,
		PluginList: PluginList,
		PluginModel: PluginModel
	};
});
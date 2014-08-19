var deps = [
	'jquery', 'underscore', 'backbone', 'baseView', 'text!./tpls/plugins.html'
];
define(deps, function($,_,Backbone, BaseView, tplSource){
	'use strict';

	var templates = BaseView.prototype.extractTemplates(tplSource);

	// We will use some models help
	var PluginModel = Backbone.Model.extend({
		defaults: {
			id: 'unknown',
			name: 'Unknown Plugin',
			description: 'No description',
			version: 'Unkown',
			author: 'Unknown'
		}
	});

	var PluginCollection = Backbone.Collection.extend({
		model: PluginModel
	});

	/**
	 * Single plugin view
	 *
	 * @event 'activate' When user click on the activate button.
	 * @event 'deactivate' When user click on the deactivate button.
	 */
	var PluginView = BaseView.extend({
		tagName: 'li',
		tpl: templates.pluginTpl,

		events: {
			'click .js-plugin-activate': 'onActivate',
			'click .js-plugin-deactivate': 'onDeactivate'
		},

		className: function() {
			var className = 'tule-plugin';
			if(this.model.get('active'))
				className += ' tule-plugin-active';
			return className;
		},

		onActivate: function(e){
			e.preventDefault();
			this.trigger('activate', this.model);
		},
		onDeactivate: function(e){
			e.preventDefault();
			this.trigger('deactivate', this.model);
		},
		attributes: function(){
			return {
				'id': 'tule-plugin-' + this.model.id
			};
		}
	});

	/**
	 * The view for the plugin list.
	 *
	 *
	 * @event 'activate' When user click on the activate button.
	 *        				The definition model is passed as argument.
	 *
	 * @event 'deactivate' When user click on the deactivate button.
	 *        				The definition model is passed as argument.
	 */
	var PluginListView = BaseView.extend({
		tagName: 'ul',
		className: 'tule-plugin-list',

		/**
		 * Initialize the list. Uses the data attribute of its options argument to
		 * create a collection with the plugin definitions.
		 *
		 * @param  {Object} opts Only the data attribute with the plugin definitions is
		 *                       processed.
		 */
		initialize: function(opts) {
			this.collection = new PluginCollection(opts.data);
			this.createPluginViews();
		},

		createPluginViews: function() {
			var me = this;

			this.subViews = {};

			this.collection.each(function(plugin){
				var pluginView = new PluginView({model: plugin});
				me.subViews[plugin.id] = pluginView;

				me.listenTo(pluginView, 'activate', me.reTrigger('activate'));
				me.listenTo(pluginView, 'deactivate', me.reTrigger('deactivate'));
			});
		},

		render: function() {
			var me = this;

			if(!this.subViews || _.isEmpty(this.subViews)){
				this.$el.append('<li>There are no plugins installed.</li>');
				return this;
			}

			_.each(this.subViews, function(pluginView){
				pluginView.render();
				me.$el.append(pluginView.el);
				pluginView.delegateEvents();
			});

			return this;
		}
	});

	return {
		PluginView:	PluginView,
		PluginListView: PluginListView
	};
});
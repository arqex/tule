define(['jquery', 'underscore', 'backbone', 'views/mainView', 'modules/plugins/plugins'], function($,_,Backbone, mainView, Plugins){
var DumbView = Backbone.View.extend({
		render: function(text){
			this.$el.html(text);
		}
	}),
	dumbView = new DumbView({el: '#page>.content'});

	return {
		main: function(){
			mainView.render('Start kicking some asses selecting an option from the left menu.');
			mainView.loadView(dumbView);
			mainView.setTitle('Plugins');
			dumbView.render('This is the plugin View');

			var pluginList = new Plugins.PluginList([]);
			pluginList.fetch().then(function(){
				var pluginView = new Plugins.PluginListView({collection: pluginList});

				mainView.loadView(pluginView.render());
				console.log(pluginList);
			});
		}
	};
});
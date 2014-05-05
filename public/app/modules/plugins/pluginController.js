define(['jquery', 'underscore', 'backbone', 'modules/core/mainController', './pluginModels'], 
	function($,_,Backbone, mainController, Plugins){

	var DumbView = Backbone.View.extend({
			render: function(text){
				this.$el.html(text);
			}
		}),
		dumbView = new DumbView({el: '#page>.content'})
	;

	return {
		main: function(){
			mainController.render('Start kicking some asses selecting an option from the left menu.');
			mainController.loadView(dumbView);
			mainController.setTitle('Plugins');
			dumbView.render('This is the plugin View');

			var pluginList = new Plugins.PluginList([]);
			pluginList.fetch().then(function(){
				var pluginView = new Plugins.PluginListView({collection: pluginList});

				mainController.loadView(pluginView.render());
				console.log(pluginList);
			});
		}
	};
});
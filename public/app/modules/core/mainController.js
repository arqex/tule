define(['jquery', 'underscore', 'backbone', 'modules/alerts/alerts', 'modules/navigation/navigationController'], 
	function($,_,Backbone, Alerts, Navigation){

	var MainController = Backbone.View.extend({
		initialize: function(opts){
			window.alerter = Alerts.alerter;
			this.$('.pagetitle').after(Alerts.alerter.el);

			this.navigation = new Navigation({routes: opts.routes})			
		},

		loadContent: function(file, method, args){
			var me = this;
			var tpl = $(document.children).find('.content');
			require([file], function(Controller){				
				var controller = new Controller({args: args});
				controller.render(tpl);				
			});
		}
	});

	return MainController;
});
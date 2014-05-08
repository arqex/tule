var deps = [
	'jquery', 'underscore', 'backbone', 
	'modules/alerts/alerts', 
	'modules/navigation/navigationController',
	'./region'
];

define(deps, function($,_,Backbone, Alerts, Navigation, Region){

	var MainController = Backbone.View.extend({
		initialize: function(opts){
			window.alerter = Alerts.alerter;
			this.$('.pagetitle').after(Alerts.alerter.el);

			this.navigation 		= opts.navigation;
			this.navigationRegion 	= new Region({selector: this.$('nav')});
			this.viewRegion 		= new Region({selector: this.$('.content')});
		},

		loadContent: function(file, method, args){
			var me = this;			
			require([file], function(Controller){				
				var controller = new Controller({args: args});
				controller.querying.then(function(){
					me.viewRegion.show(controller);
				});
			});

			if(this.navigationRegion.showed){
				this.navigation.render();
			} else {
				this.navigationRegion.showed = true;
				this.navigationRegion.show(this.navigation);
				this.navigation.selectFirstNavElement();
			}
		}
	});

	return MainController;
});
define(['jquery', 'underscore', 'backbone', 'modules/alerts/alerts'], function($,_,Backbone, Alerts){
	var MainView = Backbone.View.extend({
		contentView: false,
		initialize: function() {
			window.alerter = Alerts.alerter;
			this.$('.pagetitle').after(Alerts.alerter.el);
		},
		loadView: function(view){
			if(view.close)
				view.close();
			this.contentView = view;
			this.$('.content').html(view.$el);
		},
		setTitle: function(title){
			this.$('.pagetitle').html(title);
		}
	});

	return new MainView({el: '#page'});
});
define(['jquery', 'underscore', 'backbone'], function($,_,Backbone){
	var MainView = Backbone.View.extend({
		contentView: false,
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
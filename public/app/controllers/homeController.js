define(['jquery', 'underscore', 'backbone', 'views/mainView'], function($,_,Backbone, mainView){
var DumbView = Backbone.View.extend({
		render: function(text){
			this.$el.html(text);
		}
	}),
	dumbView = new DumbView({el: '#content'});

	return {
		index: function(){
			mainView.render('Start kicking some asses selecting an option from the left menu.');
			mainView.loadView(dumbView);
			mainView.setTitle('Welcome');
		},
		notfound: function(){
			mainView.render('It seems like you follow a wrong URL.');
			mainView.loadView(dumbView);
			mainView.setTitle('Not found');
		}
	}	
});
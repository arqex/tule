define(['jquery', 'underscore', 'backbone', './mainController'], function($,_,Backbone, mainController){
var DumbView = Backbone.View.extend({
		render: function(text){
			this.$el.html(text);
		}
	}),
	dumbView = new DumbView({el: '#content'});

	return {
		index: function(){
			mainController.render('Start kicking some asses selecting an option from the left menu.');
			mainController.loadView(dumbView);
			mainController.setTitle('Welcome');
		},
		notfound: function(){
			mainController.render('It seems like you follow a wrong URL.');
			mainController.loadView(dumbView);
			mainController.setTitle('Not found');
		}
	}	
});
"use strict";


define(['backbone', 'pageController'], function(Backbone, PageController){

return PageController.extend({
	title: 'Welcome',
	contentView: Backbone.View.extend({
		render: function(){
			this.el.innerHTML = 'Start kicking some asses selecting an option from the left menu.';
		}
	})
});

});
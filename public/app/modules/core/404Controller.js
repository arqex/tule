"use strict";


define(['backbone', 'pageController'], function(Backbone, PageController){

return PageController.extend({
	title: 'Ooooops!',
	contentView: Backbone.View.extend({
		render: function(){
			this.el.innerHTML = 'What your are looking for is missing. <b>404 NOT FOUND</b>';
		}
	})
});

});


var deps = [
	'jquery', 'underscore', 'backbone'
];
define(deps, function($,_,Backbone){
	'use strict';

	var LogoView = Backbone.View.extend({
		tpl: _.template('<a class="tule-title" href="<%= url %>"><%= title %></a>'),
		tagName: 'h1',
		className: 'tuleTitle',
		render: function(){
			this.el.innerHTML = this.tpl(this.model.toJSON());
		}
	});

	return LogoView;
});
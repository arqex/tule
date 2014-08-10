define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

	'use strict';

	var Setting = Backbone.Model.extend({
		idAttribute: 'name',

		url: function() {
			return '/api/settings/'+ this.get('name');
		}
	});

	return {
		Setting: Setting
	};
});

"use strict";

define(['jquery', 'underscore', 'backbone', 'events'], function($, _, Backbone, Events){

var services = {};

var dispenser = function(){
	var get = function(type){
		return services[type] || {};
	};

	var add = function(type, service){
		if(!services[type]){
			services[type] = service;
			Events.resolve('service:ready:' + type);
			return service;
		}
		return false;
	};

	return {
		get: get,
		add: add
	};
};

	return dispenser();
});
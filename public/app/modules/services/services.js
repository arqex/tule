"use strict";

define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){

var services = {};

var dispenser = function(){
	var get = function(type){
		return services[type] || {};
	};

	var add = function(type, service){
		if(!services[type])
			return services[type] = service;
		return false;
	};

	return {
		get: get,
		add: add
	};
};

	return dispenser();
});
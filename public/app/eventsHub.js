'use strict';

define(['underscore', 'backbone'], function(_, Backbone){
	var Events = _.extend({}, Backbone.Events),
		resolved = {}
	;

	Events.resolve = function(){
		if(!arguments.length)
			return;

		var key = arguments[0],
			parameters = Array.prototype.slice.call(arguments, 1)
		;

		resolved[key] = parameters;
		this.trigger(key);
		return this;
	};

	Events.on = function(name, callback, context){
		var resolvedContext = context || window;

		if(resolved[name])
			callback.apply(resolvedContext, resolved[name]);

		Backbone.Events.on.call(this, name, callback, context);
	};

	return Events;
});
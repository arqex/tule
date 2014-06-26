'use strict';

var hub;

define(['underscore', 'backbone'], function(_, Backbone){

	var Events = Backbone.Events;

	if(hub)
		return hub;

	if(Events._bbOn){
		hub = _.extend({}, Events);
		return hub;
	}



	// Extends Backbone Events with permanet event capabilities
	// https://github.com/arqex/backbone-resolve

	if(Events._bbOn)
		return _.extend({}, Events);

	/**
	 * Create a permanent event in the object.
	 * Any extra arguments will be passed to the listener callback.
	 *
	 * @chainable
	 * @param  {String} name Event name.
	 * @return {Object}      this
	 */
	Events.resolve = function(name/* , arg1, ..., argN */){
		// make sure we have a resoved array
		this._resolved || (this._resolved = {});

		// Any aditional parameter is usde as argument for the callbacks
		var parameters = Array.prototype.slice.call(arguments, 1);

		// Store the parameter values of the resolved event
		this._resolved[name] = parameters;

		// Trigger the event to call any bound listener
		return this.trigger.apply(this, arguments);
	};

	/**
	 * Discard a resolved event so further added listeners
	 * are not executed inmediately.
	 *
	 * @chainable
	 * @param  {String} name Event name.
	 * @return {Object} this
	 */
	Events.discard = function(name) {
		if(this._resolved && this._resolved[name])
			delete this._resolved[name];

		return this;
	};

	// Store original backbone on method
	Events._bbOn = Events.on;

	// Override original method with the permanent events aware one.
	Events.on = function(name, callback, context){
		// If the event has been resolved, execute the callback
		if(this._resolved && this._resolved[name])
			callback.apply(context || this, this._resolved[name]);

		//And then continue as a standard on(ce) call
		return this._bbOn(name, callback, context);
	};

	hub = _.extend({}, Events);
	return hub;
});
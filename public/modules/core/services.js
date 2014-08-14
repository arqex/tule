define(['jquery', 'underscore', 'backbone', 'events'], function($, _, Backbone, Events){

'use strict';

/**
 * All the services will be stored in this private object.
 */
var services,
	settings
;

/**
 * Services are just a way of render some APIs available to the whole application.
 * Usually they make easier the access to some data objects, without the need of
 * knowing how those objects are created or fetched. Collections and settings services
 * are good examples of how to retrieve documents or settings easily using their API.
 */
var ServiceManager = function() {
	services = {};
};

ServiceManager.prototype = {
	init: function(initSettings) {
		//Store settings
		settings = initSettings;

		// Don't allow to use this method anymore
		delete this.init;
	},
	/**
	 * Get a service
	 * @param  {String} serviceName Name of the service
	 * @return {Object}             The service or false if not found
	 */
	get: function(serviceName) {
		return services[serviceName] || false;
	},

	/**
	 * Add a service to the available ones
	 * @param {String} serviceName Name used to fetch the service in the future.
	 * @param {Object} service     Service to be stored.
	 */
	add: function(serviceName, service) {
		if(!services[serviceName]){
			services[serviceName] = service;

			// I there is an init method pass the settings to it.
			if(service.init){
				service.init(settings);

				// Don't allow to call init again
				delete service.init;
			}

			Events.trigger('service:added', serviceName);
			Events.resolve('service:ready:' + serviceName);
			return service;
		}
		return false;
	}
};

return new ServiceManager();


});
'use strict';

var when = require('when'),
	log = require('winston')
;

var resolve = function(queue, returnValue, args){
	var callbacks = queue.shift(),
		promises = [],
		deferred = when.defer()
	;
	for (var i = 0; i < callbacks.length; i++) {
		promises.push(callbacks[i].callback.apply(undefined, args));
	}

	when.settle(promises).then(function(results){
		var result = args[0];

		results.forEach(function(res){
			if(res.state === 'fulfilled')
				result = res.value;
		});

		if(!queue.length){
			if(returnValue)
				deferred.resolve(result);
			else
				deferred.resolve();
		}
		else {
			if(returnValue)
				args[0] = result;

			resolve(queue, returnValue, args).then(function(resolveResult){
				if(returnValue)
					deferred.resolve(resolveResult);
				else
					deferred.resolve();
			});
		}
	});

	return deferred.promise;
};

var createArray = function(ob){
	return [ob];
};

var cloneArguments = function(args) {
	return args.map( cloneValue );
};

var cloneValue = function( value, deep ){

	// Falsy and functions don't need cloning
	if( !value || typeof value == 'function' )
		return value;

	// Array
	if(Array.isArray(value)){
		return value.slice(0);
	}

	// Date
	if(value instanceof Date)
		return new Date( value.getTime() );

	// Object
	if(value === Object(value)) {

		// Dont clone more than one level
		if( deep )
			return value;

		var clone = {};

		for( var key in value )
			clone[key] = cloneValue( value[key], true );

		return clone;
	}

	// Others don't need a copy
	else
		return value;
}

module.exports = {
	on: function(hooks, pluginId, hookName, priority, callback){
		if(typeof priority === 'function'){
			callback = priority;
			priority = 0; //Default priority
		}

		if(!hooks[hookName])
			hooks[hookName] = {};
		if(!hooks[hookName][priority])
			hooks[hookName][priority] = [];

		hooks[hookName][priority].push({callback: callback, pluginId: pluginId});
	},
	off: function(hooks, hookName, callback){
		var priorities = hooks[hookName];
		if(!priorities)
			return;
		for(var priority in priorities){
			var methods = priorities[priority];
			for (var i = methods.length - 1; i >= 0; i--) {
				if(methods[i].callback == callback)
					priorities[priority].splice(i,1);
			}
		}
	},
	/**
	 * Trigger function is used by the hooks 'trigger' and 'filter' method.
	 *
	 * @param  {Object} hooks       All the functions hooked. Actions if trigger is called
	 *                              and filetrs if 'filter' is called.
	 * @param  {Boolean} returnValue Whether to return a value. false for trigger and true for filter.
	 * @return {Promise}            A promise to be fulfilled when all the actions or filters have been called.
	 */
	trigger: function(hooks, returnValue){
		var args = Array.prototype.slice.call(arguments, 2, arguments.length),
			hookName = args.shift(),
			result = args[0],
			queue = [],
			deferred = when.defer()
		;

		// Arguments are cloned to not modify original ones
		args = cloneArguments(args);

		if(!hookName){
			deferred.resolve(result);
			return deferred.promise;
		}

		log.debug('Triggering ' + hookName);

		var priorityStack = hooks[hookName];
		if(!priorityStack){
			deferred.resolve(result);
			return deferred.promise;
		}

		var priorities = Object.keys(priorityStack).sort();

		for (var i = priorities.length - 1; i >= 0; i--) {
			var priority = priorities[i];

			if(!returnValue)
				queue.push(priorityStack[priority]);
			else{
				queue = queue.concat(priorityStack[priority].map(createArray));
			}
		}


		if(!queue.length){
			deferred.resolve(result);
			return deferred.promise;
		}

		return resolve(queue, returnValue, args);
	}
};
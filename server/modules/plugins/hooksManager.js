var when = require('when');

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

module.exports = {
	on: function(hooks, pluginId, hookName, priority, callback){
		if(typeof priority === 'function'){
			callback = priority;
			priority = 0; //Default priority
		}

		console.log('ON ' + hookName);

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
	trigger: function(hooks, returnValue){
		var args = Array.prototype.slice.call(arguments, 2, arguments.length),
			hookName = args.shift(),
			result = args[0],
			queue = [],
			deferred = when.defer()
		;

		if(!hookName){
			deferred.resolve(result);
			return deferred.promise;
		}


		console.log('TRIGGER ' + hookName);

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
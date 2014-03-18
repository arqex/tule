'use strict';

var fs = require('fs'),
	config = require('config'),
	path = require('path'),
	when = require('when'),
	promisify = require('when/node/function'),
	pluginsPath = config.path.plugins,
	_ = require('underscore')
;


var PluginManager = function(){

};

PluginManager.prototype = {
	getAllPluginDefinitions: function(){
		var me = this,
			deferred = when.defer()
		;
		fs.readdir(pluginsPath, function(err, files){
			if(err)
				return deferred.reject('ERROR READING PLUGIN DIRECTORY ' + err);

			var statPromises = [],
				pluginList = []
			;

			_.each(files, function(file){
				var filePath = path.join(pluginsPath, file),
					promise = promisify.call(fs.stat, filePath)
				;
				promise.then(function(stat){
					if(stat.isDirectory)
						pluginList.push(file);
				});
				statPromises.push(promise);
			});

			when.all(statPromises).then(function(){
				me.getPluginDefinitions(pluginList).then(function(definitions){
					deferred.resolve(definitions);
				});
			});
		});

		return deferred.promise;
	},
	getPluginDefinitions: function(pluginList){
		var me = this,
			deferred = when.defer(),
			promises = [],
			definitions = []
		;

		if(!pluginList.length)
			return deferred.resolve([]);

		_.each(pluginList, function(pluginDir){
			promises.push(me.getPluginDefinition(pluginDir));
		});

		var addDefinitions = function(){
			_.each(promises, function(promise){
				var status = promise.inspect();

				if(status.state == 'fulfilled')
					definitions.push(status.value);
			});
			deferred.resolve(definitions);
		};

		when.all(promises).then(addDefinitions, addDefinitions);

		return deferred.promise;
	},
	getPluginDefinition: function(dirName){
		var descriptionPath = path.join(config.path.plugins, dirName, 'package.json'),
			deferred = when.defer()
		;

		fs.readFile(descriptionPath, function(err, contents){
			var description;

			if(err)
				return deferred.reject('Error reading package.json for ' + dirName);

			try {
				description = JSON.parse(contents);
			} catch (e) {
				return deferred.reject('Invalid package.json for ' + dirName);
			}

			description.id = dirName;

			deferred.resolve(description);
		});

		return deferred.promise;
	},
	createDefinitionsObject: function(promises){
		var definitions = [];
		_.each(promises, function(promise, dirName){
			var status = promise.inspect();
			if(status.state == 'fulfilled'){
				var def = status.value;
				def.id = dirName;
				definitions.push(def);
			}
			else
				console.log('Definition error for ' + dirName + ': ' + status.reason);
		});
		return definitions;
	},

	getActivePlugins: function(){
		var me = this,
			deferred = when.defer()
		;

		if(this.active){
			deferred.resolve(this.active);
			return deferred.promise;
		}

		fs.readFile('./activePlugins.json', function(err, contents){
			var pluginList = [];

			if(err)
				contents = '[]';
			try {
				pluginList = JSON.parse(contents);
			} catch(e) {
				pluginList = [];
			}

			if(!pluginList.length)
				return [];

			me.getPluginDefinitions(pluginList).then(function(definitions){
				me.active = definitions;

				if(pluginList.length != definitions.length){
					pluginList = definitions.map(function(def){return def.id;});
					me.saveActivePlugins(pluginList);
				}

				deferred.resolve(definitions);
			});
		});
		return deferred.promise;
	},

	saveActivePlugins: function(pluginList){
		var deferred = when.defer();
		pluginList.sort();
		fs.writeFile('./activePlugins.json', JSON.stringify(pluginList), 'utf8', function(err){
			if(err){
				console.log('Can\'t write activePlugins.json');
				return deferred.reject('Can\'t write activePlugins.json');
			}
			return deferred.resolve(pluginList);
		});
		return deferred.promise;
	},

	activate: function(pluginId){
		var me = this,
			deferred = when.defer()
		;
		this.getActivePlugins().then(function(definitions){
			var definition = _.find(definitions, function(def){ return def.id == pluginId; }),
				pluginList
			;

			if(definition)
				return deferred.resolve(definitions);

			me.getPluginDefinition(pluginId).then(function(definition){
				definitions.push(definition);

				//Update current active definitions
				me.active = definitions;

				pluginList = definitions.map(function(def){return def.id;});

				me.saveActivePlugins(pluginList);
				deferred.resolve(pluginList);
			});
		});
		return deferred.promise;
	},

	deactivate: function(pluginId){
		var me = this,
			deferred = when.defer()
		;
		this.getActivePlugins().then(function(definitions){
			var definition = _.find(definitions, function(def){ return def.id == pluginId; }),
				pluginList
			;
			if(!definition)
				return deferred.resolve(definitions);

			definitions = _.filter(definitions, function(def){return def != pluginId;});
			pluginList = definitions.map(function(def){return def.id;});
			me.active = definitions;
			deferred.resolve(pluginList);
		});
		return deferred.promise;
	}
};

module.exports = {
	manager: new PluginManager()
};
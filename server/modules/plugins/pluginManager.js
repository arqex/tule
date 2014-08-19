'use strict';

var fs = require('fs'),
	config = require('config'),
	path = require('path'),
	when = require('when'),
	promisify = require('when/node/function'),
	pluginsPath = config.path.plugins,
	_ = require('underscore'),
	hooksManager = require('./hooksManager.js')
;

// Objects to store hook callbacks
var actions = {},
	filters = {},
	// pluginHashes stores callbacks by plugins, so it is possible
	// to remove a plugin's actions and filters on deactivation.
	pluginHashes = {}
;

/**
 * The plugin manager is used to activate and deactivate plugin, as well
 * as getting info about installed plugins.
 *
 * It create a hooks object per plugin, so they can execute their functions
 * in tule workflow.
 *
 */
var PluginManager = function(){
		this.plugins = {};
	},
	app = false
;

PluginManager.prototype = {
	activePluginsFile: __dirname + '/activePlugins.json',
	/**
	 * Initialize the plugin manager, and all the plugins that are already
	 * active.
	 *
	 * Also creates the hooks object for tule core.
	 *
	 * @param  {Application} appObject The express application object.
	 * @return {Promise} 			A promise to be resolved when the manager
	 *                          	is ready.
	 */

	init: function(appObject){
		var me = this,
			deferred = when.defer()
		;

		// Store a local reference to the app object
		app = appObject;
		app.hooks = me.getHooks(''); // Empty id for core hooks

		// Initialize active plugins
		this.getActivePlugins().then(
			function(definitions){

				// Plugins can initialize asynchronously
				_.each(definitions, function(def){
					var plugin = me.initPlugin(def);
					if(!plugin.error)
						me.plugins[def.id] = plugin;
				});

				// We are ready to keep going
				deferred.resolve();
			},
			function(){
				deferred.reject('Error retrieving plugin definitions');
			}
		);

		return deferred.promise;
	},

	/**
	 * Initialize a plugin given its definition.
	 *
	 * @param  {Object} definition A definition object extracted from the plugin's
	 *                             package.json file.
	 * @return {Object}            Plugin's object.
	 */
	initPlugin: function(definition){
		var me = this,
			plugin
		;

		try {

			// Definition must have a main attribute with the name of the main script
			if(!definition.main)
				throw ('Unknown entry point for plugin ' + definition.id);

			var entryPoint = path.join(config.path.plugins, definition.id, definition.main);

			plugin = require(entryPoint);

			// The plugin must have an init method
			if(!_.isFunction(plugin.init))
				throw ('No init function for plugin ' + definition.id);

			// Create a hook object for the plugin
			var hooks = me.getHooks(definition.id);
			plugin.init(hooks);

		} catch (e) {
			console.error(e);
			plugin = {error: e};
		}

		return plugin;
	},

	/**
	 * Create a stamp and a hooks object based on it for a plugin.
	 * This way it is possible to recognize the plugin actions and filters.
	 *
	 * @param  {String} pluginId Plugin id, the plugin dirname.
	 * @return {Object}          Hooks object.
	 */
	getHooks: function(pluginId){

		// Every plugin need to be its own hooks, so it is possible
		// to remove its filters and actions on deactivate.
		var pluginHash = 'p' + Math.floor(Math.random() * 10000000);
		pluginHashes[pluginId] = pluginHash;
		return {
			on: hooksManager.on.bind(this, actions, pluginHash),
			off: hooksManager.off.bind(this, actions),
			trigger: hooksManager.trigger.bind(this, actions, false),
			addFilter: hooksManager.on.bind(this, filters, pluginHash),
			removeFilter: hooksManager.off.bind(this, filters),
			filter: hooksManager.trigger.bind(this, filters, true)
		};
	},

	/**
	 * Read the package.json file of every plugin.
	 *
	 * @return {Promise} A promise to be resolved when the definitions are loaded.
	 */
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

	/**
	 * Get the plugin definitions (package.json) of the given plugins.
	 *
	 * @param  {Array} pluginList Array with the ids of the plugins.
	 * @return {Promise}          Promise to be resolved when the definition are loaded.
	 */
	getPluginDefinitions: function(pluginList){
		var me = this,
			deferred = when.defer(),
			promises = []
		;

		if(!pluginList.length)
			return deferred.resolve([]);

		_.each(pluginList, function(pluginDir){
			promises.push(me.getPluginDefinition(pluginDir));
		});

		when.settle(promises)
			.then(function(descriptors){
				var definitions = [];
				descriptors.forEach(function(d){
					if(d.state == 'fulfilled')
						definitions.push(d.value);
				});
				deferred.resolve(definitions);
			})
		;

		return deferred.promise;
	},

	/**
	 * Get the plugin definitions (package.json) of the given pluginId (plugin dir).
	 *
	 * @param  {String} pluginId The name of the plugin's directory.
	 * @return {Promise}         A promise to be resolved when the plugin definition is loaded.
	 */
	getPluginDefinition: function(pluginId){
		var descriptionPath = path.join(config.path.plugins, pluginId, 'package.json'),
			deferred = when.defer()
		;

		fs.readFile(descriptionPath, function(err, contents){
			var description;

			if(err)
				return deferred.reject('Error reading package.json for ' + pluginId);

			try {
				description = JSON.parse(contents);
			} catch (e) {
				return deferred.reject('Invalid package.json for ' + pluginId);
			}

			description.id = pluginId;

			deferred.resolve(description);
		});

		return deferred.promise;
	},

	/**
	 * Create an array of definitions given a list of fulfilled or rejected
	 * plugin's promises. Rejected promises will write a warning in the console.
	 *
	 * @param  {Array} promises Promises list.
	 * @return {Array}          Plugins definitions from the fulfilled promises.
	 */
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

	/**
	 * Get the definitions of currently active plugins. The list is active plugins
	 * is stored in the activePlugins.json file.
	 *
	 * @return {Promise} A promise to be resolved with the definitions once they are loaded.
	 */
	getActivePlugins: function(){
		var me = this,
			deferred = when.defer()
		;

		// If we already have the active list, just resolve
		if(this.active){
			deferred.resolve(this.active);
			return deferred.promise;
		}

		// Read the active plugins list.
		fs.readFile(this.activePluginsFile, function(err, contents){
			var pluginList = [];

			if(err){
				console.log(err);
				contents = '[]';
			}
			try {
				pluginList = JSON.parse(contents);
			} catch(e) {
				console.log('Cant parse ' + contents);
				pluginList = [];
			}

			// If there are no active plugins, resolve now
			if(!pluginList.length){
				return deferred.resolve([]);
			}

			// Read the definitions of the plugins
			me.getPluginDefinitions(pluginList).then(function(definitions){
				me.active = definitions;
				console.log(definitions);

				// If some plugin couldn't be loaded, remove it from the active list
				if(pluginList.length != definitions.length){
					pluginList = definitions.map(function(def){return def.id;});
					me.saveActivePlugins(pluginList);
				}

				deferred.resolve(definitions);
			});
		});
		return deferred.promise;
	},

	/**
	 * Updates the activePlugin.json with the list of plugins given.
	 *
	 * @param  {Array} pluginList The list of active plugins.
	 * @return {Promise}          A promise to be resolved when the list is saved.
	 */
	saveActivePlugins: function(pluginList){
		var deferred = when.defer();
		pluginList.sort();
		fs.writeFile(this.activePluginsFile, JSON.stringify(pluginList), 'utf8', function(err){
			if(err){
				console.log('Can\'t write activePlugins.json');
				return deferred.reject('Can\'t write activePlugins.json');
			}
			return deferred.resolve(pluginList);
		});
		return deferred.promise;
	},

	/**
	 * Activates a plugin.
	 *
	 * @param  {String} pluginId The plugin directory name.
	 * @return {Promise}         To be resolved when the plugin has been activated.
	 */
	activate: function(pluginId){
		var me = this,
			deferred = when.defer()
		;

		// Check if the plugin is not active already
		this.getActivePlugins().then(function(definitions){
			var definition = _.find(definitions, function(def){ return def.id == pluginId; }),
				pluginList
			;

			// If it is active, resolve it.
			if(definition)
				return deferred.resolve(definitions);

			// Get the definition
			me.getPluginDefinition(pluginId).then(function(definition){
				var plugin = me.initPlugin(definition);
				if(plugin.error)
					return deferred.reject(plugin.error);

				me.plugins[pluginId] = plugin;
				definitions.push(definition);

				pluginList = definitions.map(function(def){return def.id;});

				me.saveActivePlugins(pluginList).then(function(){

					// Update current active definitions
					me.active = definitions;
					deferred.resolve(definitions);

					// Trigger the event
					app.hooks.trigger('plugin:activated', pluginId);
				});
			});
		});
		return deferred.promise;
	},

	/**
	 * Deactivates a plugin.
	 *
	 * @param  {Array} pluginList The list of active plugins.
	 * @return {Promise}          To be resolved when the plugin has been deactivated.
	 */
	deactivate: function(pluginId){
		var me = this,
			deferred = when.defer()
		;

		// Check if the plugin is active
		this.getActivePlugins().then(function(definitions){
			var definition = _.find(definitions, function(def){ return def.id == pluginId; }),
				pluginList
			;

			// If it is not active, just resolve.
			if(!definition)
				return deferred.resolve(definitions);

			if(me.plugins[pluginId])
				delete me.plugins[pluginId];

			definitions = _.filter(definitions, function(def){return def.id != pluginId;});
			pluginList = definitions.map(function(def){return def.id;});

			me.saveActivePlugins(pluginList).then(function(){
				// Update current active definitions
				me.active = definitions;
				deferred.resolve(definitions);

				// Remove plugins actions and filters
				me.cleanPluginCallbacks(pluginId);
				app.hooks.trigger('plugin:deactivated', pluginId);
			});
		});
		return deferred.promise;
	},

	cleanPluginCallbacks: function(pluginId){
		var callbackObjects = [actions, filters],
			pluginHash = pluginHashes[pluginId]
		;

		// Go through the callbacks removing the plugin's functions.
		callbackObjects.forEach(function(callbackObj){
			for(var hookName in callbackObj){
				for(var priority in callbackObj[hookName]){
					var callbacks = callbackObj[hookName][priority];

					// Go backwards looking for the callbacks
					for (var i = callbacks.length - 1; i >= 0; i--) {
						if(callbacks[i].pluginId == pluginHash)
							callbacks.splice(i, 1);
					}
				}
			}
		});

		// Remove also the plugin hash.
		delete pluginHashes[pluginId];
	}
};

module.exports = new PluginManager();
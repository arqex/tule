'use strict';

var when = require('when'),
	config = require('config'),
	path = require('path'),
	pluginManager = require(path.join(config.path.modules, 'plugins/pluginManager.js'))
;

module.exports = {
	list: function(req, res){
		pluginManager.getActivePlugins().then(function(activePlugins){
			pluginManager.getAllPluginDefinitions().then(function(definitions){
				definitions.forEach(function(d){
					d.active = !!activePlugins.filter(function(plugin){return plugin.id == d.id}).length;
				});
				res.json(definitions);
			});
		});
	},
	activate: function(req, res){
		var id = req.params.id;
		if(!id)
			res.send(400, {error: 'No plugin id given.'});
		console.log('activation requested');

		pluginManager.activate(id)
			.then(function(){
				res.json({action: 'activate', id: id});
			})
			.catch(function(err){
				res.send(400, {error: err});
			})
		;
	},
	deactivate: function(req, res){
		var id = req.params.id;
		if(!id)
			res.send(400, {error: 'No plugin id given.'});

		pluginManager.deactivate(id)
			.then(function(){
				res.json({action: 'deactivate', id: id});
			})
			.catch(function(err){
				res.send(400, {error: err});
			})
		;
	}
};
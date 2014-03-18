'use strict';

var when = require('when'),
	config = require('config'),
	path = require('path'),
	plugins = require(path.join(config.path.util, 'plugin'))
;

module.exports = {
	list: function(req, res){
		plugins.manager.getAllPluginDefinitions().then(function(definitions){
			res.json(definitions);
		});
	},
	activate: function(req, res){
		var id = req.params.id;
		if(!id)
			res.send(400, {error: 'No plugin id given.'});
	},
	deactivate: function(req, res){
		var id = req.params.id;
		if(!id)
			res.send(400, {error: 'No plugin id given.'});
	}
};
"use strict";
var Path = require('path');

module.exports = function(baseUrl){
	//Add the base url to all MON routes
	var url = function(method, path){
		var out = Path.join(baseUrl, path);
		if(method)
			out = method + out;
		return out;
	};

	return {
		'get::/api/collections': 'apiCollection::list',
		'get::/api/collections/:type': 'apiCollection::getConfig',
		'put::/api/collections/:type': 'apiCollection::updateConfig',
		'post::/api/collections/:type': 'apiCollection::createConfig',
		'get::/api/collectionstatus/:type': 'apiCollection::getStatus',

		'get::/api/docs/:type': 'apiDocument::collection',
		'post::/api/docs/:type': 'apiDocument::create',
		'get::/api/docs/:type/:id': 'apiDocument::get',
		'put::/api/docs/:type/:id': 'apiDocument::update',
		'delete::/api/docs/:type/:id': 'apiDocument::remove',

		'get::/mongoreset': 'mongoReset::main',

		'*': 'main'
	};
};
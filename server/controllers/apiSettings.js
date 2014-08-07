'use strict';

var config = require('config'),
	settings = require(config.path.modules + '/settings/settingsManager')
;

module.exports = {
	/**
	 * Controller for the route 'get::settings/:name'.
	 * Get a setting given its name.
	 *
	 * @param  {http.ClientRequest} req The request
	 * @param  {http.ServerResponse} res The response
	 */
	get: function(req, res) {
		var name = req.params.name;

		settings.getPublic(name)
			.then(function(settingValue){
				if(typeof settingValue == 'undefined')
					res.send(404);
				else
					res.json({name: name, value: settingValue});
			})
			.catch(function(err){
				if(err && err.error == 'private')
					res.send(404);
				else
					res.send(400, {error: 'Unexpected error: ' + err});
			})
		;
	},

	/**
	 * Controller for the routes 'post::settings/:name' & 'put::settings/:name'.
	 * Creates or updates a setting a setting given its name. If we try to update
	 * a private setting we will get an error.
	 *
	 * @param  {http.ClientRequest} req The request
	 * @param  {http.ServerResponse} res The response
	 */
	save: function(req, res) {
		var name = req.params.name,
		   doc = req.body
		;

		if(!name || doc.name != name)
			return res.send(400, {error: 'Invalid name.'});

		if(typeof doc.name == 'undefined')
			return res.send(400, {error: 'No setting value sent.'});

		// We need to be sure the setting is public
		settings.getPublic(name)
			.then(function(){

				// Now, we are sure it is not private.
				settings.save(name, doc.value, true)
					.then(function(){
						res.json(doc);
					})
					.catch(function(err){
						res.send(400, {error: 'Unexpected error: ' + err});
					})
				;
			})
			.catch(function(err){
				if(err && err.message)
					res.send(400, {error: 'Error: ' + err.message});

				res.send(400, {error: 'Unexpected error: ' + err});
			})
		;
	},

	/**
	 * Controller for the routes 'delete::settings/:name'.
	 * Deletes a setting given its name.
	 *
	 * @param  {http.ClientRequest} req The request
	 * @param  {http.ServerResponse} res The response
	 */
	remove: function(req, res) {
		var name = req.params.name;

		settings.remove(name)
			.then(function(){
				res.send(200, {});
			})
			.catch(function(err){
				res.send(400, {error: 'Unexpected error: ' + err});
			})
		;
	}
};
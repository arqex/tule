var config = require('config'),
	frontendManager = require(config.path.modules + '/frontend/frontendManager')
;


module.exports = function(req, res){
	'use strict';

	// If it is a file request (have extension), 404
	if(req.path.match(/\.\w{2,4}$/))
		return res.send(404);

	// Route request, send the template
	frontendManager.getFrontSettings().then(function(settings){
		if(!settings)
			settings = {};

		res.render('main.html', {frontSettings: JSON.stringify(settings)});

		}).catch(function(err){
		res.send('400', {error: 'Can\'t find front settings: ' + err});
	});
};
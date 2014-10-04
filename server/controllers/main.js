var config = require('config'),
	frontendManager = require(config.path.modules + '/frontend/frontendManager')
;


var tuleController = function(req, res) {
	req.hooks.trigger( 'controller:tule:pre' );

	// If it is a file request (have extension), 404
	if(req.path.match(/\.\w{2,4}$/))
		return res.send(404);

	// Route request, send the template
	frontendManager.getFrontSettings().then(function(settings){
			if(!settings)
				settings = {};

			res.render('main.html', {frontSettings: settings});

		})
		.catch(function(err){
			res.send('400', {error: 'Can\'t find front settings: ' + err});
		})
	;
};


module.exports = {
	tule: tuleController,

	entry: function(req, res){
		'use strict';

		req.hooks.trigger( 'controller:main:pre', req );

		// Allow to override the main controller function
		req.hooks.filter( 'controller:main', tuleController )
			.then( function( controller ){
				controller( req, res );
			})
		;
	}
};
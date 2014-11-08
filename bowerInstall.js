'use strict';

var fs = require('fs'),
	Path = require('path'),
	spawn = require('child_process').exec
;

var command = 'node_modules/.bin/bower install';

// Only if dependencies don't exist
if( !fileExistsSync( Path( __dirname , 'tule/public/bower_components' ) )){

	console.log( 'Installing bower packages...' );
	var child = exec( command );

	child.on('data', function(data){
		console.log(data);
	};

	child.on('close', function(){
		console.log( 'Bower dependencies installed.');
	});
}
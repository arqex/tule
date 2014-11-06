'use strict';

var fs = require('fs'),
	Path = require('path'),
	spawn = require('child_process').spawn
;

console.log( child );
console.log( process );

var appPath = Path.join( __dirname, '..' ),
	sourcesPath = Path.join( __dirname, 'appCreation')
;

var copy = function(src, dest) {
	try {
		var configContents = fs.readFileSync(
			Path.join( sourcesPath, src + '.txt' )
		);

		fs.writeFileSync(
			dest,
			configContents,
			{flag: 'wx'}
		);
		console.log( src + ' file created');
	}
	catch (e) {
		console.error( src + ' file not created: ' + e.message );
	}
}

var mkdir = function( folderName ) {
	try {
		fs.mkdirSync( Path.join( appPath, folderName ) );
		console.log( folderName + ' folder created');
	}
	catch (e) {
		console.error( folderName + ' folder not created: ' + e.message );
	}
}

// Add tule as a submodule
copy( 'gitmodules', Path.join( appPath, '.gitmodules' ) );

// Logs
mkdir( 'logs');

// Plugins
mkdir( 'plugins');
copy( 'activePlugins', Path.join( appPath, 'plugins/activePlugins.json'));

// Config
mkdir( 'config');
copy( 'config', Path.join( appPath, 'config/default.js' ) );

// Create the main app file
copy( 'app', Path.join( appPath, 'app.js' ) );

// Prepare bower
copy( 'bowerrc', Path.join( appPath, '.bowerrc' ));
copy( 'bower', Path.join( appPath, 'bower.json'));

// Create the package.json file
// First copy the base file
copy( 'package', Path.join( appPath, 'package.json') );

// Then ask for updates
console.log( '\nCreating the package...\n' );
var child = spawn( 'npm', [ 'init' ], {cwd: appPath, stdio: 'inherit'} );

child.on( 'exit', function() {

	// Install the dependencies
	console.log( '\npackage.json file created. Installing dependencies...\n');
	var installConfig = spawn( 'npm', ['install'], {cwd: appPath, stdio: 'inherit'} );

	installConfig.on( 'close', function(){
		console.log( 'App created successfully. Bye' );
	});
});

var config = require('config'),
	mPath = config.path.modules
;

var modules = {
	db: mPath +'/db/dbManager',
	qdb: mPath + '/db/qdb',
	settings: mPath + '/settings/settingsManager'
};

config.require = function( module ) {
	return require( modules[module] );
};
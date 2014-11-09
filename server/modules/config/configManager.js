'use strict';

var config = require('config'),
	Path = require('path')
;


/**
 * Object to map module names to their path.
 * @type {Object}
 */
var registered = {},
	ConfigManager = {

	/**
	 * Loads a config file to a property of the config object.
	 * @param  {String} fileName         The name of the config file placed in the config.path.config folder.
	 * @param  {String} propertyName The name of the property that will hold the settings.
	 *                               If no property name is provided the filename is used as attribute.
	 * @return {undefined}
	 */
	load: function( fileName, propertyName ) {
		if( !propertyName )
			propertyName = fileName;
		try {
			config[propertyName] = require( Path.join( config.path.config, fileName ) );
		}
		catch( e ) {
			console.log( e.stack );
		}
	},

	/**
	 * Register a path to be required using utils.
	 * @param {String} name The name to be used when requiring
	 * @param {String} path The path to the required module
	 */
	register: function( name, path ){
		if( !name || !path ) {
			console.log( 'Tool not added: ' + name);
			return false;
		}

		registered[ name ] = path;
		console.log( 'Tool added.' );
		return true;
	},

	/**
	 * Require a registered module
	 * @param  {String} name The registered module name
	 * @return {Object|false} The module object or false on fail
	 */
	require: function( name ){
		if( !name || !registered[ name ] ) {
			console.log( 'Unkown tool name: ' + name );
			return false;
		}

		try{
			return require( registered[ name ] );
		} catch ( e ) {
			console.log( e.stack );
			return false;
		}
	}
};

for( var method in ConfigManager )
	config[ method ] = ConfigManager[ method ];

module.exports = config;
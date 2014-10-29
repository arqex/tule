'use strict';

var config = require( 'config' ),
	logger = require('winston')
;

var UtilsManager = function(){
	this.utils = {};
};

UtilsManager.prototype = {

	/**
	 * Register a path to be required using utils.
	 * @param {String} name The name to be used when requiring
	 * @param {String} path The path to the required module
	 */
	register: function( name, path ){
		if( !name || !path ) {
			logger.error( 'Tool not added.', {name: name, path: path} );
			return false;
		}

		this.utils[ name ] = path;
		logger.debug( 'Tool added.', {name: name, path: path} );
		return true;
	},

	/**
	 * Require a registered module
	 * @param  {String} name The registered module name
	 * @return {Object|false} The module object or false on fail
	 */
	require: function( name ){
		if( !name || !this.utils[ name ] ) {
			logger.error( 'Unkown tool name: ' + name );
			return false;
		}

		try{
			return require( this.utils[ name ] );
		} catch ( e ) {
			logger.error( e.stack );
			return false;
		}
	}
};

var utils = new UtilsManager();

config.require = utils.require.bind( utils );
config.register = utils.register.bind( utils );

module.exports = { /* Nothing here */ };
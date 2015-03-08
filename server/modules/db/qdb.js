'use strict';

var Q = require( 'q' ),
	config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance()
;

/**
 * Qcollection make easier to call methods that handle documents in a collection,
 * like db.collection('cars').find
 *
 * @param {String} c CollectionName
 */
var Qcollection = function( c ){
	this.c = c;
};

Qcollection.prototype = {};

var methods = ['find', 'findOne', 'insert', 'update', 'save', 'remove', 'count', 'distinct', 'aggregate'];

// Promisify all the methods of a collection
methods.forEach( function( method ){
	Qcollection.prototype[ method ] = function() {

		// If the query is a string, we suposse it is the _id
		if( method != 'distinct' && arguments.length && typeof arguments[0] == 'string' )
			arguments[0] = {_id: arguments[0] };

		return Q.nfapply( this.c[method].bind( this.c ), arguments );
	};
});

/**
 * Qdb make easier to call methods that handle collection methods
 */
var Qdb = function(){};

var qdbMethods = ['getCollectionNames', 'createCollection', 'renameCollection', 'dropCollection'];

qdbMethods.forEach( function( method ){
	Qdb.prototype[ method ] = function() {
		return Q.nfapply( db[method].bind( db), arguments );
	};
});

module.exports = function( collectionName ) {
	if( collectionName )
		return new Qcollection( db.collection( collectionName ) );

	return new Qdb();
};
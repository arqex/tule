'use strict';

var config = require( 'config' ),
	qdb = config.require( 'qdb' ),
	Q = require('q'),
	logger = require( 'winston'),
	_ = require('underscore')
;

var actions = {
	importData: function( data, res ){
		if( !data.collection || !data.docs )
			return res.send( 400, 'Not collection or docs given.' );

		//Let's convert dates
		data.docs.forEach( function( d ){
			var value, date;
			for( var key in d ){
				value = d[ key ];
				date = new Date( value );
				if( value && value.constructor == String && !isNaN( date.getTime() ) )
					d[key] = date;
			}
		});

		logger.info( 'Importing ' + data.docs.length + ' docs.' );
		qdb( data.collection ).insert( data.docs )
			.then( function( docs){
				logger.info( 'Imported ok' );
				res.json({ message: 'All the docs where imported ok.', docs: docs });
			})
			.catch( function( err ){
				logger.error( err.stack );
				res.send( 500, 'There was an error importing the data' );
			})
		;
	},
	exportData: function( data, res ){
		if( !data.collection  )
			return res.send( 400, 'Not collection given.' );

		var docs = [];

		if( !data.repeatAttribute ){
			return qdb( data.collection).find( data.query, data.modifiers )
				.then( function( results ){
					return res.json( results );
				})
			;
		}

		return qdb( data.collection ).distinct( data.repeatAttribute, data.query )
			.then( function( results ){
				if( !results || ! results.length )
					return res.send( 500, 'No elements by the repeatAttribute' );

				var p = Q(1);
				results.forEach( function( r ){
					var q = _.extend({}, data.query );
					q[ data.repeatAttribute ] = r;
					p = p.then( function(){
						return qdb( data.collection ).find( q, data.modifiers )
							.then( function( rDocs ){
								logger.info( 'Export ' + rDocs.length + ' docs for ' + r );
								docs = docs.concat( rDocs );
							})
						;
					});
				});

				return p.then( function(){
					res.json( docs );
				});
			})
			.catch( function( err ){
				logger.error( err.stack );
			})
		;
	}
};

module.exports = {
	hub: function( req, res ){
		var data = req.body;

		if( !data.action )
			res.send( 400, 'No action provided.' );

		if( !actions[ data.action] )
			res.send( 400, 'Unknown action.');

		return actions[ data.action ]( data, res );
	}
};
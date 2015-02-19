'use strict';

var config = require( 'config' ),
	qdb = config.require( 'qdb' ),
	logger = require( 'winston')
;

var actions = {
	importData: function( data, res ){
		console.log( data );
		if( !data.collection || !data.docs )
			return res.send( 400, 'Not collection or docs given.' );

		//Let's convert dates
		data.docs.forEach( function( d ){
			var value, date;
			for( var key in d ){
				value = d[ key ];
				date = new Date( value );
				if( value.constructor == String && !isNaN( date.getTime() ) )
					d[key] = date;
			}
		});

		qdb( data.collection ).insert( data.docs )
			.then( function( docs){
				res.json({ message: 'All the docs where imported ok.', docs: docs });
			})
			.catch( function( err ){
				logger.error( err.stack );
				res.send( 500, 'There was an error importing the data' );
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
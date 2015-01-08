define( function( ){
	'use strict';

	var prefix = 'tule-';

	return {
		get: function( name ){
			var value = localStorage[ prefix + name ];
			if( !value )
				return undefined;

			return JSON.parse( value );
		},

		set: function( name, value ){
			localStorage.setItem( prefix + name, JSON.stringify( value ) );
		}
	};
});
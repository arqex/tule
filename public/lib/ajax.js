var deps = [
	'bower_components/qwest/src/qwest'
];

define( deps, function( qwest ){

	// Lets make json default
	var originals = [],
		toOverride = ['post','get','put','delete'],
		ajax = qwest,
		setDefaults = function( options ){
			var opts = options || { responseType: 'json', retries: 0 };

			if( !opts.responseType )
				opts.responseType = 'json';
			if( !opts.retries )
				opts.retries = 1;

			return opts;
		}
	;

	toOverride.forEach( function( method ){
		originals[method] = qwest[method];
		ajax[method] = function( url, data, options ){
			var opts = setDefaults( options );

			if( method != 'get' ){
				if( !opts.dataType )
					opts.dataType = 'json';
				data = data || {};
			}

			return originals[method].call( qwest, url, data, opts );
		};
	});

	return ajax;
});
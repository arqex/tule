var deps = [
	'bower_components/qwest/src/qwest'
];

define( deps, function( qwest ){

	// Lets make json default
	var originalPost = qwest.post,
		ajax = qwest
	;

	qwest.setDefaultXdrResponseType('json');

	ajax.post = function( url, data, options ){
		var opts = options || { dataType: 'json', responseType: 'json' };

		if( !opts.dataType )
			opts.dataType = 'json';
		if( !opts.responseType )
			opts.responseType = 'json';

		return originalPost.call( qwest, url, data, opts );
	};

	return ajax;
});
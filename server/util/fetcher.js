var http = require('socks5-http-client'),
	parser = require('url'),
	deferred = require('when').defer()
;

module.exports.get = function(url){
	var parsed = parser.parse(url);
	console.log(parsed);
	var	options = {
			socksPort: 9150,
			host: parsed.host,
			path: parsed.path,
			port: 80,
			headers: {'user-agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36'}
		},
		request = http.get(options, function(res){
			var data = '';
			res.on('data', function(chunk){
				data += chunk;
			});
			res.on('end', function(){
				deferred.resolve(data);
			});
		})
	;
	return deferred.promise;
}


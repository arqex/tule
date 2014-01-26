module.exports = {
	// route: /hello.txt
	hello: function(req, res){
  		res.send('Hello Worldcitoo');		
	},

	// route: /mongo
	mongo: function(req, res){
		var collection = req.app.db.collection('test');
		collection.insert({message: 'MongoDB working ok'}, function(err, docs){
			collection.find().limit(1).each(function(err, doc){
				console.log('documento: ' + doc);
			});
			collection.count(function(err, count){
				res.send(count + ' documentos');
			})
		});		
	},

	// route: /fetch
	fetch: function(req, res){
		var consol = require('../util/consol'),
			thread = consol.create()
		;
		thread.on('init', function(){

			thread.msg('Fetching url...');
			var url = 'http://www.transfermarkt.es/es/primera-division/spielplangesamt/wettbewerb_ES1.html',
				fetcher = require('../util/fetcher')
			;

			fetcher.get(url).done(function(contents){
				thread.msg('... fetching ok. Parsing contents...');
				var $ = require('cheerio'),
					body = $(contents).find('#centerbig')
				;

				thread.msg('... Parsed ok.');
				//thread.socket.emit('contents', {contents: body.html()});
			});

		});

		res.render('fetch.html', {consolId: thread.id});
	},

	// route: /consol
	consol: function(req, res){
		var config = require('config'),
			consol = require('../util/consol'),
			thread = consol.create()
		;
		thread.on('init', function(){
			thread.msg('Console initialized successfully: ' + thread.id);
		});
		thread.on('cmd', function(data){
			thread.msg('Command received: ' + data.cmd);
		});
		res.render('consol.html', {consolId: thread.id});
	}
}
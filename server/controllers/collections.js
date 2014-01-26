var listFields = {
	test: ['message']
}

module.exports = {
	// route: /collection/list/:type
	list: function(req, res){
		var type = req.params.type,
			collection = req.app.db.collection(type),
			templateData = {
				title: type + ' collection',
				collectionType: type
			}
		;
		req.app.db.getCollectionNames(function(err, names){
			if(err)
				console.error(err);
			
			if(names.indexOf(type) != -1){
				var skip = 0,
					limit = 20
				;
				collection.runCommand('count', function(err, count){
					collection.find({}).limit(20, function(err, docs){
						var templateData = {
							title: type + ' collection',
							collectionType: type,
							docs: docs,
							fields: listFields[type],
							from: skip + 1,
							to: Math.min(count.n, skip + 1 + limit),
							count: count.n
						}	
						res.renderTemplate('collections/list.html', templateData);
					});
				});
				
			}
			else{
				templateData.title += ' not found';
				res.renderTemplate('collections/create.html', templateData);
			}

			
		});		
	}
};
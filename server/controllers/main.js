var config = require('config'),
	frontendManager = require(config.path.modules + '/frontend/frontendManager')
;


module.exports = function(req, res){
    frontendManager.getFrontSettings().then(function(settings){
		if(!settings)
			settings = {};
		res.render('main.html', {frontSettings: JSON.stringify(settings)});
    }).catch(function(err){
		res.send('400', {error: 'Can\'t find front settings: ' + err});
    });
};
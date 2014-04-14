var config = require('config'),
	settingsManager = require(config.path.modules + '/settings/settingsManager')
;


module.exports = function(req, res){
    settingsManager.getFrontSettings().then(function(settings){
		if(!settings)
			settings = {};
		res.render('main.html', {frontSettings: JSON.stringify(settings)});
    }).catch(function(err){
		res.send('400', {error: 'Can\'t find front settings: ' + err});
    });
};
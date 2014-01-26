var config = require('config'),
	templateData = {
		navigation: config.navigation
	}
;

module.exports = function(req, res){
	res.render('main.html', templateData);
};
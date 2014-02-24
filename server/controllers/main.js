var config = require('config'),
	templateData = {
		navigation: config.navigation,
		globals: {
			datatypes: ['string', 'array', 'boolean', 'float', 'integer', 'object'],
			datatypesPath: 'modules/datatypes/'
		}
	}
;

module.exports = function(req, res){
	res.render('main.html', templateData);
};
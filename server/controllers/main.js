var config = require('config'),
	templateData = {
		navigation: config.navigation,
		globals: {
			datatypes: ['array', 'boolean', 'float', 'integer', 'object', 'string'],
			datatypesPath: 'modules/datatypes/'
		}
	}
;

module.exports = function(req, res){
	res.render('main.html', templateData);
};
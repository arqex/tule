var _u = require('underscore'),
	defaults = {
		title: 'No title',
		navigation: 'No navigation',
		content: 'No content'
	}
;
module.exports = {
	middleware: function(req, res, next){
		res.renderTemplate = function(src, options) {
			res.render(src, options, function(err, html){				
				var params = _u.extend({}, defaults, options);
				params.content = html;
				res.render('main.html', params);
			});
		};
		next();
	}
};
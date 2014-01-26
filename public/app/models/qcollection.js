define(['jquery', 'underscore', 'backbone', 'models/qdoc'], function($, _, Backbone, QDoc){
	return Backbone.Collection.extend({
		model: QDoc
	});
});
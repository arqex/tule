var deps = [
	'jquery', 'underscore', 'backbone'
];
define(deps, function($,_,Backbone){
	"use strict";

	var ExtractTemplates = {extractTemplates: function(tplSource){
		var sources = $(tplSource).find('script[type="text/template"]'),
			tpls = {}
		;

		sources.each(function(i, source){
			tpls[source.id] = _.template(source.innerHTML);
		});

		return tpls;
	}};

	return {
		ExtractTemplates: ExtractTemplates
	};
});
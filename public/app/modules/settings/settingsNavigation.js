"use strict";

var deps = [
	'jquery', 'underscore', 'backbone', 'services',
	'baseController', 'pageController', 'text!./tpls/settingsNavigationTpl.html',
	'./settingsViews'
];

define(deps, function($, _, Backbone, Services, BaseController, PageController, tplSource, SettingsViews){
	var createPreview = function(){
		var preview = new SettingsViews.NavigationPreviewView({});
		return preview;
	};

	var createToolsbox = function(){
		var toolsbox = new SettingsViews.NavigationToolsboxView();
		return toolsbox;
	};

	var SettingsController = BaseController.extend({
		template: $(tplSource).find('#settingsNavigationTpl').html(),
		regionSelectors: {
			'preview': '.preview',
			'toolsbox': '.toolsbox'
		},

		init: function(opts){
			this.subViews = {};

			var me 			= this,
				deferred 	= $.Deferred()
			;

			this.querying = deferred.promise();

			// Override
			this.tpl = this.controllerTpl;
			this.subViews['preview'] = createPreview();
			this.subViews['toolsbox'] = createToolsbox();

			this.regions.preview.show(this.subViews.preview);
			this.regions.toolsbox.show(this.subViews.toolsbox);

			deferred.resolve();
		}
	});

	return PageController.extend({
		title: 'Settings nav',
		contentView: SettingsController
	});
});

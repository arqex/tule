"use strict";

var deps = [
	'jquery', 'underscore', 'backbone', 'services',
	'modules/core/baseController', 'text!./tpls/settingsNavigationTpl.html',
	'./settingsViews'
];

define(deps, function($, _, Backbone, Services, BaseController, tplSource, SettingsViews){
	var createPreview = function(){
		var preview = new SettingsViews.NavigationPreviewView({});
		return preview;
	};

	var createToolsbox = function(){
		var toolsbox = new SettingsViews.NavigationToolsboxView();
		return toolsbox;
	};

	var SettingsController = BaseController.extend({
		controllerTpl: $(tplSource).find('#settingsNavigationTpl').html(),		

		initialize: function(opts){
			this.subViews = {};
			this.regions = {};
			this.regionViews = {
				'.preview': 'preview',
				'.toolsbox': 'toolsbox'
			};

			var me 			= this,
				deferred 	= $.Deferred()
			;

			this.querying = deferred.promise();

			// Override
			this.tpl = this.controllerTpl;
			this.subViews['preview'] = createPreview();
			this.subViews['toolsbox'] = createToolsbox();

			deferred.resolve();
		}
	});


	return SettingsController;
});
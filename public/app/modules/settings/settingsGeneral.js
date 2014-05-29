"use strict";

var deps = [
	'jquery', 'underscore', 'backbone', 'services',
	'baseController', 'text!./tpls/settingsGeneralTpl.html',
	'./settingsViews'
];

define(deps, function($, _, Backbone, Services, BaseController, tplSource, SettingsViews){
	var createPreview = function(){
		var preview = new SettingsViews.NavigationPreviewView({
			name: 'Bastardo de mierda'
		});

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

			if(this.subViews['preview'])
				this.runPreviewListeners();
			if(this.subViews['toolsbox'])
				this.runToolsboxListeners();

			deferred.resolve();
		},

		runPreviewListeners: function(){

		},

		runToolsboxListeners: function(){

		}
	});


	return SettingsController;
});

var deps = [
	'jquery', 'underscore', 'backbone',

	'baseView',

	'text!./tpls/collectionViews.html',

	'alerts'
];

define(deps, function($, _, Backbone, BaseView, tplSource, Alerts){
	'use strict';

	var templates = BaseView.prototype.extractTemplates(tplSource);

	var DocumentView = BaseView.extend({
		tpl: templates.doc,
		tagName: 'tbody',

		defaultStatus: {
			mode: 'display'
		},

		initialize: function(opts) {
			this.fields = opts.fields || [{href: '#', className: 'remove', icon: 'times'}];
			if(opts.editing)
				this.state('mode', 'edit');

			this.docOptions = opts.docOptions || {};
			this.docOptions.mode = 'edit';
		},

		render: function() {
			this.$el.html(this.tpl(_.extend(
				{}, this.model.toJSON(), {state: this.currentState.toJSON()}
			)));

			if(this.state('mode') == 'edit'){

			}
		}
	});

	var CollectionView = BaseView.extend({
		tagName: 'table',
		initialize: function(options) {
			this.setDocuments(options.docs);
			this.settings = options.settings || {};
		},

		setDocuments: function(docs) {
			this.collection =
		}
	});

	return {
		DocumentView: DocumentView
	};

});
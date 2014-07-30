var deps = [
	'jquery', 'underscore', 'backbone',

	'baseView',

	'text!./tpls/collectionViews.html',

	'alerts', 'services'
];

define(deps, function($, _, Backbone, BaseView, tplSource, Alerts, Services){
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

			this.collectionSettings = opts.collectionSettings || {};

			this.objectView =  false;

		},

		render: function() {
			this.$el.html(this.tpl(this.getTemplateData()));

			if(this.state('mode') == 'edit'){
				if(!this.objectView)
					this.objectView = this.createObjectView();

				this.objectView.render();
				this.$('.js-doc-edit').prepend(this.objectView.el);
			}
		},

		getTemplateData: function() {
			return {
				doc: this.model.toJSON(),
				fields: this.fields,
				state: this.currentState.toJSON()
			};
		},

		createObjectView: function() {
			return Services.get('datatype').get({
				datatype: {id: 'object', options: this.collectionSettings},
				value: this.model.toJSON(),
				state: {mode: 'edit'},
				viewOptions: {closeable: false}
			})
		},

		edit: function() {
			if(!this.state('mode') == 'edit')
				return;

			this.state('mode', 'edit');
			this.render();
		},

		stopEdit: function() {
			if(this.state('mode') != 'edit')
				return;

			this.state('mode', 'display');
			this.render();
		}
	});

	var CollectionView = BaseView.extend({
		tagName: 'table',
		className: 'tule-collection-items',

		events: {
			'click .js-doc-ok': 'onClickOk',
			'click .js-doc-cancel': 'onClickCancel',
			'click .js-doc-header>td': 'onClickField'
		},

		initialize: function(options) {
			this.collectionSettings = options.collectionSettings || {};
			this.resetSubViews();
		},

		resetSubViews: function() {
			var me = this,
				headerFields = this.getDocHeaderFields()
			;

			if(this.subViews){
				_.each(this.subViews, function(subView){
					subView.remove;
				});
			}

			this.subViews = {};

			this.collection.each(function(doc){
				me.subViews[doc.id] = new DocumentView({
					model: doc,
					collectionSettings: me.settings,
					fields: headerFields
				});
			});
		},

		getDocHeaderFields: function() {
			var headerFields = this.collectionSettings.headerFields;

			if(!headerFields || !headerFields.length){
				headerFields = [];

				if(this.collection.length){
					var model = this.collection.at(0);

					if(model.get('title'))
						headerFields.push('title');
					else if(model.get('name'))
						headerFields.push('name');
					else
						headerFields.push('_id');
				}
			}

			return headerFields.concat([
				{action: 'edit', href: "#", icon: 'pencil'},
				{action: 'remove', href: "#", icon: 'times'}
			]);
		},

		render: function() {
			var me = this;

			this.el.innerHTML = '';

			_.each(this.subViews, function(view){
				view.render();
				me.$el.append(view.el);
				view.delegateEvents();
			});

			return this;
		},

		onClickOk: function(e){
			e.preventDefault();
			var	docId = $(e.target).closest('.tule-doc-content').data('id'),
				subView = this.subViews[docId]
			;

			if(subView)
				this.trigger('saveDocument', subView);
		},

		onClickCancel: function(e){
			e.preventDefault();

			var	docId = $(e.target).closest('.tule-doc-content').data('id'),
				view = this.subViews[docId]
			;

			if(view)
				view.stopEdit();
		},

		onClickField: function(e){
			e.preventDefault();
			var field = $(e.currentTarget),
				docId = field.closest('.tule-doc-header').data('id'),
				subView = this.subViews[docId],
				action = field.data('action')
			;
			if(subView){
				this.trigger('click:' + action, subView);
				this.trigger('clickField', subView, action);
			}
		}
	});

	return {
		DocumentView: DocumentView,
		CollectionView: CollectionView
	};

});

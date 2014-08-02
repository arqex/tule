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
			});
		},

		edit: function() {
			if(this.state('mode') == 'edit')
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
					subView.remove();
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

			// If we don't have header fields, add the _id.
			if(!headerFields || !headerFields.length){
					headerFields = ['_id'];
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
				this.trigger('saveDocument', subView, subView.objectView.typeOptions.propertyDefinitions);
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
		},

		updateCollectionSettings: function(updatedSettings) {
			this.collectionSettings = updatedSettings;
			_.each(this.subViews, function(view){
				view.collectionSettings = updatedSettings;
				view.objectView.typeOptions = updatedSettings;
				view.objectView.createPropertyDefinitions();
			});
		}
	});

	/**
	 * View for create new documents, prints out the new document form and triggers
	 * 'createDoc' when the user create a new document.	 *
	 */
	var CreateView = BaseView.extend({
		tpl: templates.createDoc,
		tagName: 'form',
		className: 'tule-doc-create',

		defaultStatus: {
			open: false
		},

		events: {
			'click .js-doc-create-cancel': 'onClickCancel',
			'click .js-doc-create-ok': 'onClickOk'
		},

		initialize: function(opts) {
			this.collectionSettings = opts.collectionSettings;
			this.reset();
		},

		render: function() {
			var open = this.state('open');
			this.$el.html(this.tpl(this.getTemplateData()));

			if(open) {
				if(!this.objectView)
					this.objectView = this.createObjectView();

				this.$('.js-doc-create-form').append(this.objectView.el);
				this.objectView.render();
			}
		},

		createObjectView: function() {
			var settings = this.mergeMandatoryAndHeaderFields();
			return Services.get('datatype').get({
				datatype: {id: 'object', options: settings},
				value: this.model.toJSON(),
				state: {mode: 'edit'},
				viewOptions: {closeable: false, editAllProperties: true}
			});
		},

		/**
		 * Return a copy of the settings where the header fields are added to the mandatory properties,
		 * in order to make those fields appear in the form automatically.
		 *
		 * @return {Object} Updated collection settings.
		 */
		mergeMandatoryAndHeaderFields: function(){
			// Deep cloning
			var settings = $.extend(true, {}, this.collectionSettings);

			if(!settings.mandatoryProperties) {
				settings.mandatoryProperties = [];
			}

			if(!settings.headerFields) {
				settings.headerFields = [];
			}

			settings.mandatoryProperties = _.union(settings.mandatoryProperties, settings.headerFields);

			return settings;
		},

		open: function() {
			if(!this.state('open')){
				this.state('open', true);
				this.render();
				this.$el.addClass('tule-doc-create-open');

				// Focus the first input
				var inputs = this.$('input');
				if(inputs.length){
					//wait for rendering
					setTimeout(function(){
						$(inputs[0]).focus();
					},100);
				}
			}

			return this;
		},

		close: function() {
			if(this.state('open')){
				this.state('open', false);
				this.render();
				this.$el.removeClass('tule-doc-create-open');
			}

			return this;
		},

		reset: function() {
			this.model = Services.get('collection')
				.collection(this.collectionSettings.name)
					.getNew()
			;

			return this;
		},

		onClickOk: function(e) {
			e.preventDefault();

			// Update the doc
			this.model.set(this.objectView.getEditValue());

			// And trigger a creation petition
			this.trigger('createDoc', this.model, this.objectView.propertyDefinitions);
		},

		onClickCancel: function(e) {
			e.preventDefault();
			this.trigger('cancel');
		},

		updateCollectionSettings: function(updatedSettings) {
			this.collectionSettings = updatedSettings;
		}
	});

	var PaginationView = BaseView.extend({
		tpl: templates.pagination,
		defaults: {
			currentDoc: 0,
			pageSize: 0,
			count: 0
		},

		events: {
			'click a': 'onClickPage',
			'keydown input': 'onKeyPress'
		},

		initialize: function(opts) {
			if(!this.model)
				this.createModel(opts);

			this.listenTo(this.model, 'change', this.render);
		},

		createModel: function(opts) {
			var me = this,
				value = {}
			;

			_.each(this.defaults, function(def, key) {
				value[key] = opts[key] || me.defaults[key];
			});

			this.model = new Backbone.Model(value);
		},

		render: function() {

			// Frist, calculate page numbers
			this.calculatePages();

			var data = this.getTemplateData(),
				pagePadding = 2
			;

			if(data.lastPage <= 1)
				return this.$el.html('');


			data.from = Math.max(1, data.currentPage - pagePadding);
			data.to = Math.min(data.currentPage + pagePadding, data.lastPage);

			this.$el.html(
				this.tpl(data)
			);

			return this;
		},

		calculatePages: function() {
			var data = this.model.toJSON();
			if(!data.count || !data.pageSize) {
				data.lastPage = 0;
				data.currentPage = 0;
			}
			else {
				data.currentPage = Math.floor(data.currentDoc / data.pageSize) + 1;
				data.lastPage = Math.floor(data.count / data.pageSize) + 1;
			}

			this.model.set(data);
		},

		onClickPage: function(e) {
			e.preventDefault();
			var page = $(e.currentTarget).data('page');

			if(page != this.model.get('currentPage'))
				this.trigger('goto', page);
		},

		onKeyPress: function(e) {
			// If press enter
			if(e.which == 13){
				e.preventDefault();

				var page = this.$('input').val();
				if(page != this.model.get('currentPage'))
					this.trigger('goto', page);
			}
		}
	});

	var SearchView = BaseView.extend({
		tpl: templates.search,
		clauseTpl: templates.searchClause,

		className: 'tule-search',

		events: {
			'click .js-search-add': 'onAddClause',
			'click .js-search-cancel': 'onCancel',
			'click .js-search-ok': 'onOk',
			'click .js-search-delete': 'onDeleteClause'
		},

		defaultState: {
			open: false
		},

		initialize: function(opts) {
			this.query = opts.query || {};
			this.clauses = [];
		},

		open: function() {
			if(!this.state('open')){
				this.state('open', true);

				//Render if it's never been rendered
				if(!this.$('.js-search-clauses').length)
					this.render();

				this.$el.addClass('tule-doc-search-open');

				// Focus the first input
				var inputs = this.$('input');
				if(inputs.length){
					//wait for rendering
					setTimeout(function(){
						$(inputs[0]).focus();
					},100);
				}
			}

			return this;
		},

		close: function() {
			if(this.state('open')){
				this.state('open', false);
				this.$el.removeClass('tule-doc-search-open');
			}

			return this;
		},

		render: function() {
			var me = this,
				clauses = this.queryToClauses(this.query)
			;
			this.$el.html(this.tpl(this.getTemplateData()));

			if(!clauses.length)
				return this.addClause();

			_.each(clauses, function(clause){
				this.$('.js-search-clauses').append(this.clauseTpl(clause));
			});

			return this;
		},

		queryToClauses: function(query) {
			//TODO implementation
			return [];
		},

		clausesToQuery: function(clauses) {
			var me = this,
				clauseBuffer = [],
				orGroups = []
			;
			_.each(clauses, function(clause) {
				if(clause.logical == 'and')
					clauseBuffer.push(me.clauseToMongo(clause));
				else if(clause.logical == 'or') {
					orGroups.push({'$and': clauseBuffer});
					clauseBuffer = [me.clauseToMongo(clause)];
				}
			});

			orGroups.push({'$and': clauseBuffer});

			if(orGroups.length == 1){
				return orGroups[0];
			}
			else {
				return {'$or': orGroups};
			}
		},

		clauseToMongo: function(clause) {
			var mongoClause = {},
				logical = clause.value
			;

			if(clause.comparison != 'eq'){
				logical = {};
				logical['$' + clause.comparison] = clause.value;
			}

			mongoClause[clause.key] = logical;
			return mongoClause;
		},

		addClause: function(operator) {
			var clause = {
					operator:operator,
					key: '',
					value: '',
					comparison: ''
				},
				$clauses
			;

			// Add the new clause
			this.$('.js-search-clauses').append(this.clauseTpl(clause));

			$clauses = this.$('.js-search-clause');

			if($clauses.length > 1)
				this.enableDeleteClauses();

			$clauses.last().find('.js-search-key').focus();
		},

		getClauseValues: function() {
			var clauses = [];

			this.$('.js-search-clause').each(function(){
				var $clause = $(this),
					clause = {
						key: $.trim($clause.find('.js-search-key').val() || ''),
						value: $.trim($clause.find('.js-search-value').val() || '')
					}
				;

				if(clause.key && clause.value){
					clause.logical = $clause.find('.js-search-op-logical').val() || 'and';
					clause.comparison = $clause.find('.js-search-op-comparison').val();

					clauses.push(clause);
				}
			});

			return clauses;
		},

		onAddClause: function(e){
			e.preventDefault();

			var values = this.getClauseValues(),
				$clauses = this.$('.js-search-clause')
			;

			if(values.length != $clauses.length){
				return Alerts.add({
					message: 'Fill all the clauses before adding a new one.',
					level: 'error',
					autoclose: 6000
				});
			}

			this.addClause($(e.target).data('operator'));
		},

		onCancel: function(e){
			e.preventDefault();
			this.trigger('searchCancel');
		},

		onOk: function(e){
			e.preventDefault();
			var query = this.clausesToQuery(this.getClauseValues());
			this.trigger('searchOk', query);
		},

		onDeleteClause: function(e) {
			e.preventDefault();
			var $clause = $(e.target).closest('.js-search-clause'),
				$clauses = this.$('.js-search-clause')
			;

			if ($clauses.length < 2)
				return;

			if ($clauses.length == 2)
				this.disableDeleteClauses();

			$clause.remove();

			this.$('.js-search-clause').first()
				.find('.js-search-op-logical')
					.addClass('tule-search-op-hidden')
			;
		},

		enableDeleteClauses: function() {
			this.$('.js-search-delete').show();
		},

		disableDeleteClauses: function() {
			this.$('.js-search-delete').hide();
		}
	});

	var DocumentCountView = BaseView.extend({
		tpl: templates.docCount,
		modelDefaults: {
			count: 0,
			search: false
		},

		initialize: function(opts) {
			var modelData = {};

			_.each(this.modelDefaults, function(value, key){
				modelData[key] = opts[key] || value;
			});

			this.model = new Backbone.Model(modelData);

			this.listenTo(this.model, 'change', this.render);
		}
	});

	return {
		DocumentView: DocumentView,
		CollectionView: CollectionView,
		CreateView: CreateView,
		PaginationView: PaginationView,
		SearchView: SearchView,
		DocumentCountView: DocumentCountView
	};

});

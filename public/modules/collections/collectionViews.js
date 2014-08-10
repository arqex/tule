var deps = [
	'jquery', 'underscore', 'backbone',

	'baseView',

	'text!./tpls/collectionViews.html',

	'alerts', 'services'
];

define(deps, function($, _, Backbone, BaseView, tplSource, Alerts, Services){
	'use strict';

	var templates = BaseView.prototype.extractTemplates(tplSource);

	/**
	 * View for a single document inside a collection view.
	 * In display mode, it show a header with the fields in the headerFields collection setting.
	 * In edit mode, it uses the object type view for document editing.
	 *
	 * This view doesn't trigger any event.
	 */
	var DocumentView = BaseView.extend({
		tpl: templates.doc,
		tagName: 'tbody',

		defaultStatus: {
			mode: 'display'
		},

		initialize: function(opts) {
			this.headerFields = opts.headerFields || ['_id', {href: '#', className: 'remove', icon: 'times'}];
			if(opts.editing)
				this.state('mode', 'edit');

			this.collectionSettings = opts.collectionSettings || {};

			this.objectView =  false;
		},

		render: function() {
			this.$el.html(this.tpl(this.getTemplateData()));

			if(this.state('mode') == 'edit'){
				// Create the object view if it is not already created.
				if(!this.objectView)
					this.objectView = this.createObjectView();

				this.objectView.render();
				this.$('.js-doc-edit').prepend(this.objectView.el);
			}

			return this;
		},

		getTemplateData: function() {
			return {
				doc: this.model.toJSON(),
				fields: this.headerFields,
				state: this.currentState.toJSON()
			};
		},

		/**
		 * Create the object view in order to edit the document.
		 *
		 * @return {ObjectTypeView}
		 */
		createObjectView: function() {
			// Use the collection settings as the object type options.
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

	/**
	 * View for a list of documents.
	 *
	 * It use the headerFields attribute from collection settings to show document's header.
	 *
	 * @event 'clickField' When a document header field is clicked.
	 *        Arguments: Document's view, Field 'action' name.
	 * @event 'click:[fieldAction]' When the document header field with action 'fieldAction'
	 *        is clicked. Arguments: Document's view.
	 * @event 'saveDocument' When user clicks ok after editing a document.
	 *        Arguments: Document's view, Document's field definitions.
	 */
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
			this.headerFields = options.headerFields;
			this.resetSubViews();
		},

		/**
		 * Remove all the subviews and re-create them using the collection attribute.
		 * This is useful when the collection is updated.
		 *
		 * @return {undefined}
		 */
		resetSubViews: function() {
			var me = this;

			if(this.subViews){
				_.each(this.subViews, function(subView){
					subView.remove();
				});
			}

			this.subViews = {};

			this.collection.each(function(doc){
				me.subViews[doc.get('_id')] = new DocumentView({
					model: doc,
					collectionSettings: me.collectionSettings,
					headerFields: me.headerFields
				});
			});
		},

		render: function() {
			var me = this;

			// If no documents, show an alert.
			if(!this.collection.length){
				this.$el.html(templates.nodocs({
					message: 'Not documents found'
				}));
			}
			else {

				// Render all the documents
				this.el.innerHTML = '';

				_.each(this.subViews, function(view){
					view.render();
					me.$el.append(view.el);
					view.delegateEvents();
				});
			}

			return this;
		},

		onClickOk: function(e){
			e.preventDefault();
			var	docId = $(e.target).closest('.tule-doc-content').data('id'),
				subView = this.subViews[docId],
				definitions
			;

			if(subView){
				definitions = subView.objectView.typeOptions ?
					subView.objectView.typeOptions.propertyDefinitions :
					{}
				;

				this.trigger('saveDocument', subView, definitions);
			}
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

		/**
		 * Update the collection settings in the view itself and in its document views.
		 *
		 * @param  {Object} updatedSettings The new settings.
		 * @return {undefined}
		 */
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
	 * View for create new documents, prints out the new document form.
	 * Uses the Object type view to edit the new document.
	 *
	 * @event 'createDoc' When the user clicks on the save button.
	 *        Arguments: The Document model, Document property definitions.
	 *
	 * @event 'cancel' When the user clicks on the cancel link. No arguments
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


		/**
		 * Create the object view in order to edit the document.
		 *
		 * @return {ObjectTypeView}
		 */
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

		/**
		 * Opens the create form.
		 *
		 * @chainable
		 */
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

		/**
		 * Closes the create form.
		 *
		 * @chainable
		 */
		close: function() {
			if(this.state('open')){
				this.state('open', false);
				this.render();
				this.$el.removeClass('tule-doc-create-open');
			}

			return this;
		},

		/**
		 * Resets the form, creating a new one.
		 *
		 * @chainable
		 */
		reset: function() {
			this.model = Services.get('collection')
				.collection(this.collectionSettings.collectionName)
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

		/**
		 * Update the collection settings.
		 *
		 * @param  {Object} updatedSettings The new collection settings.
		 * @return {undefined}
		 */
		updateCollectionSettings: function(updatedSettings) {
			this.collectionSettings = updatedSettings;
		}
	});

	/**
	 * Shows the links that allow to navigate among pages of documents.
	 *
	 * It calculates the number of the pages and the current one based on
	 * the number of documents, the page size and the current document index.
	 *
	 * @event 'goto' when the user click on a page link or uses the 'go to page' input.
	 *        Arguments: Page number.
	 */
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

		/**
		 * Initializes the view and create the model using the options given.
		 *
		 * @param  {Object} opts The data needed to start the navigation. The following
		 *                       properties are accepted:
		 *                       * currentDoc: The index of the first document that it's shown
		 *                       		in the total of documents.
		 *                       * pageSize: Number of documents shown per page. Used to calculate
		 *                       		the total count of pages and the current one.
		 *                       * count: Total of documents. Used to calculate the total count of
		 *                       		pages.
		 * @return {undefined}
		 */
		initialize: function(opts) {
			if(!this.model)
				this.createModel(opts);

			this.listenTo(this.model, 'change', this.render);
		},

		/**
		 * Create the model needed by the view.
		 *
		 * @param  {Object} opts Model properties.
		 * @return {undefined}
		 */
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

			// First, calculate page numbers
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

		/**
		 *	Calculates currentPage and lastPage, and add them to the model.
		 *
		 * @return {undefined}
		 */
		calculatePages: function() {
			var data = this.model.toJSON();
			if(!data.count || !data.pageSize) {
				data.lastPage = 0;
				data.currentPage = 0;
			}
			else {
				data.currentPage = Math.floor(data.currentDoc / data.pageSize) + 1;
				data.lastPage = Math.ceil(data.count / data.pageSize);
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

	/**
	 * View for create simple queries, in order to search documents.
	 *
	 * @event 'searchCancel' When the user clicks on the cancel button. No arguments.
	 * @event 'searchOk' When the user click on the search button.
	 *        Arguments: The Mongo alike query to be searched.
	 */
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
		},

		/**
		 * Opens the search form.
		 *
		 * @chainable
		 */
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

		/**
		 * Closes the search form.
		 *
		 * @chainable
		 */
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

		/**
		 * Translates the clauses values from the form to a MongoDB alike query.
		 *
		 * @param  {Array} clauses A list of query values, as returned by the method,
		 *                         getClauseValues.
		 * @return {Object}        The query.
		 */
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

		/**
		 * Translate a comparison single clause to a MongoDB query.
		 *
		 * @param  {Object} clause A clause.
		 * @return {Object}        MongoDB simple query.
		 */
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

		/**
		 * Add a new empty clause to the form.
		 *
		 * @param {String} operator The logical operator to be selected out of the box.
		 */
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

			// If there are more than one clause, enable delete.
			if($clauses.length > 1)
				this.enableDeleteClauses();

			$clauses.last().find('.js-search-key').focus();
		},

		/**
		 * Parses the form to get the clauses to init the search.
		 * Uncomplete clauses are not added to the returned list.
		 *
		 * @return {Array} List of claueses.
		 */
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
			var clauses = this.getClauseValues();
			if(!clauses.length)
				return Alerts.add({
					message: 'Please fill at least one clause to start the search.',
					level: 'error',
					autoclose: 6000
				});

			this.trigger('searchOk', this.clausesToQuery(clauses));
		},

		onDeleteClause: function(e) {
			e.preventDefault();
			var $clause = $(e.target).closest('.js-search-clause'),
				$clauses = this.$('.js-search-clause')
			;

			if ($clauses.length < 2)
				return;

			// If we are going to have just one clause, disable delete.
			if ($clauses.length == 2)
				this.disableDeleteClauses();

			$clause.remove();

			// Hide the logical operator in the first clause.
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

	/**
	 * A simple view to format the document count.	 *
	 */
	var DocumentCountView = BaseView.extend({
		tpl: templates.docCount,

		/**
		 * Default values for the model. Update the model to update the view.
		 * @type {Object}
		 */
		modelDefaults: {
			/**
			 * Number of documents
			 * @type {Number}
			 */
			count: 0,
			/**
			 * Wether the documents were fetched by a search
			 * @type {Boolean}
			 */
			search: false,
			documentName: 'doc'
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

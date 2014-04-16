var deps = [
	'jquery', 'underscore', 'backbone',
	'text!tpls/docTable.html',
	'text!tpls/searchTools.html',
	'modules/datatypes/dispatcher',
	'modules/alerts/alerts',
	'models/mdispenser'
];
define(deps, function($,_,Backbone, tplSource, tplSearchTools, dispatcher, Alerts, Dispenser){
	'use strict';
	var DocumentView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#docTpl').html()),

		initialize: function(opts){
			this.fields = opts.fields || [{href: '#', className: 'remove', icon: 'times'}];
			this.editing = opts.editing || false;
			this.objectView = false;
			this.docOptions = opts.docOptions || {};
			this.docOptions.mode = 'edit';
			this.hidden = opts.hidden || [];
		},
		render: function(){
			this.$el.html(this.tpl({id: this.model.id, editing: this.editing, fields: this.fields, doc: this.model.toJSON()}));

			if(this.editing){
				this.objectView = dispatcher.getView('object', this.docOptions, dispatcher.createModel(this.model.toJSON()));
				this.$('.document-content').find('td').prepend(this.objectView.$el);
				this.objectView.mode = 'edit';
				this.objectView.render();
				this.listenTo(this.objectView.model, 'change:value', function(){
					this.model.clear({silent: true});
					this.model.set(this.objectView.model.get('value'));
				});
			}
			this.trigger('rendered');
		},

		close: function(){
			if(!this.editing)
				return false;

			this.objectView.remove();
			this.editing = false;
			this.render();
		},

		open: function(){
			if(this.editing)
				return false;

			this.editing = true;
			this.render();
		},

		getValue: function(){
			if(this.editing)
				return this.objectView.getValue();
			return this.model.toJSON();
		}

	});
	
	var SearchTools = Backbone.View.extend({
		findBoxTpl: $(tplSearchTools).find('#findBoxTpl').html(),
		buttonSearchTpl: $(tplSearchTools).find('#buttonSearchTpl').html(),
		searchFormTpl: _.template($(tplSearchTools).find('#searchFormTpl').html()),
		queryClauseTpl: _.template($(tplSearchTools).find('#queryClauseTpl').html()),

		events: {
			'click .search-new': 'onClickSearchForm',
			'click .cancel-query': 'onClose',
			'click .select-clause-join': 'onClickAddClause',
			'click .search-query': 'onClickSearch',
			'click .clause-delete': 'onClickDelete'
		},

		initialize: function(opts){
			this.type = opts.type;
			this.query = {};
			this.render();
		},

		render: function(){
			this.$el.html(this.buttonSearchTpl);
			//this.$el.html(this.findBoxTpl);
		},

		renderClauses: function(operator){
			var clauses = this.$el.find('.query-clauses'),
				me = this
			;

			clauses.empty(); 

			_.each(this.query, function(clause){
				clauses.append(me.queryClauseTpl({
					position: clause['position'],
					key: clause['key'],
					comparison: clause['comparison'],
					value: clause['value'],
					operator: clause['operator'],
					length: Object.keys(me.query).length
				}));
			});

			if(operator != "delete") {
				clauses.append(this.queryClauseTpl({
					position: Object.keys(this.query).length,				
					key: false,
					comparison: false,
					value: false,
					operator: operator,
					length: Object.keys(this.query).length
				}));	
			}
		},

		onClickSearchForm: function(e){
			e.preventDefault();
			
			this.$el.find(".search-form-placeholder").append(this.searchFormTpl({type: this.type}));
			this.renderClauses();
			$(e.target).css('display', 'none');
		},

		onClose: function(e){
			e.preventDefault();

			this.$el.find('.search-new').css('display', 'block');
			$(e.target).closest('.search-form').remove();
		},

		onClickAddClause:function(e){
			var operator = $(e.target).val();
			if(!this.saveQuery())
				return Alerts.add({message:'There are empty values', level: 'error', autoclose:10000});
			this.renderClauses(operator);
		},

		saveQuery: function(operator){
			var clauses = this.$el.find('.query-clause'),
				me = this,
				empties = true,
				position = 0
			;

			this.query = {};

			_.each(clauses, function(clause){
				var key = $(clause).find('#key').val(),
					comparison = $(clause).find('#comparison').val(),
					value = $(clause).find('#value').val(),
					operator = $(clause).find('.operator').val()
				;

				if(key === '' || value === '')
					empties = false;

				me.query['clause.'+position] = {
					position: position,
					key: key,
					comparison: comparison,
					value: value,
					operator: position == 0 ? undefined : operator
				}

				position++;
			});

			return empties;
		},

		onClickSearch: function(e){
			if(!this.saveQuery())
				return Alerts.add({message:'There are empty values', level: 'error', autoclose:10000});

			var clauses = [];

			_.each(this.query, function(clause){
				clauses.push(
					clause.operator+'|'+
					encodeURI(clause.key)+'|'+
					clause.comparison+'|'+
					encodeURI(clause.value)
				);
			});

			this.onClose(e);
			this.trigger('searchDoc', clauses);
		},

		onClickDelete: function(e){
			this.saveQuery();

			var nearClause = $(e.target).closest('.query-clause'),
				key = nearClause.find('#key').val(),				
				value = nearClause.find('#value').val(),
				me = this
			;

			_.each(this.query, function(clause){
				if(clause['key'] == key && clause['value'] == value)
					//delete me.query["clause."+clause['position']];
					nearClause.remove();
			});

			this.saveQuery();
			this.renderClauses("delete");
		}
	});

	var NewDocView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#addNewTpl').html()),
		tplForm: $(tplSource).find('#newFormTpl').html(),
		events: {
			'click .document-new': 'onClickNew',
			'click .document-cancel': 'onClickCancel',
			'click .document-create': 'onClickCreate'
		},
		initialize: function(opts){			
			this.type = opts.type;
			this.collectionView = opts.collectionView;
			this.searchTools = opts.searchTools || {};
			this.settings = opts.settings;
		},

		render: function(){
			this.el = this.$el.html(this.tpl({type: this.type}));
			this.el.append(this.searchTools.$el);
			this.el.append(this.collectionView.$el);
		},

		onClickNew: function(e){
			e.preventDefault();

			this.objectView = dispatcher.getView('object', this.settings, undefined);

			this.el.find(".form-placeholder").append(this.tplForm);
			this.el.find(".object-form").append(this.objectView.$el);
			this.objectView.mode = 'edit';
			this.objectView.typeOptions.editAllProperties = true;
			this.objectView.render();

			var section = $(e.target).parentsUntil( '.content' );
			section.find('.new-document-form').css('display', 'none');
			section.find('.form').css('display', 'block');
		},

		onClickCancel: function(e){
			e.preventDefault();
			this.objectView = false;
			this.$el.find('.form').remove();
			this.close();
		},

		close: function(){
			var section = this.$el;
			section.find('.form').css('display', 'none');
			section.find('.new-document-form').css('display', 'block');
		},

		onClickCreate: function(e){
			e.preventDefault();
			var stack = {};

			_.each(this.objectView.subViews, function(subView){
				if(subView.key === '_id'){
					Alerts.add({message:'Cannot use reserved name _id as property', level: 'error', autoclose:10000});	
					return false;
				}
				subView.typeView.save();
				subView.changeMode('display');
				var value = {};
				value['key'] = subView.key;
				value['label'] = subView.label || subView.key;
				value['datatype'] = subView.datatype;
				value['value'] = subView.typeView.getValue();
				stack[subView.key] = value;
			});

			this.trigger('createDoc', this.type, stack);
		}
	});

	var NewCollectionView = NewDocView.extend({
		
		onClickCreate: function(e){
			e.preventDefault();

			var doc = Dispenser.getMCollection(this.objectView.getValue()),
				me = this
			;			

			_.each(this.objectView.subViews, function(subView){
				subView.typeView.save();
				subView.changeMode('display');
				doc.set(subView.key, subView.typeView.getValue(), {silent:true});
			});

			doc.url = '/api/collection';

			doc.save(null, {success: function(){
				Alerts.add({message:'Document saved correctly', autoclose:6000});
				doc.id = 'collection_' + me.objectView.getValue()['name'];
				doc.type = me.objectView.getValue()['name'];
				doc.url = encodeURI('/api/settings/collection_' + doc.type);
 				me.objectView = false;
				me.$el.find('.form').remove();
				me.close();
				doc.newborn = true;
				// Render collection view
				me.collection.add(doc);
				me.collectionView.createDocViews();
				me.collectionView.render();
			}});
		
		}
	});


	var CollectionView = Backbone.View.extend({
		tpl: $(tplSource).find('#tableTpl').html(),
		events: {
			'click .document-ok': 'onClickOk',
			'click .document-cancel': 'onClickCancel',
			'click .document-header>td': 'onClickField'
		},
		initialize: function(opts) {
			this.fields = opts.fields || [{href: '#', className: 'remove', icon: 'times'}];
			this.docViews = {};			
			this.docOptions = opts.docOptions || {};
			this.createDocViews(this.collection);

			this.listenTo(this.collection, 'remove', $.proxy(this.removeSubView, this));
		},

		createDocViews: function(currentCollection){
			var me = this,
				docViews = {}
			;
			currentCollection.each(function(doc){
				var docId = doc.id;
				if(doc.newborn){
					var editing = doc.newborn ? true : false;
					doc.newborn = false;	
				} else {
					var editing = me.docViews[docId] ? me.docViews[docId].editing : false;
				}
				
				docViews[docId] = new DocumentView({
					model: doc,
					fields: me.fields,
					editing: editing,
					docOptions: me.docOptions,
					hidden: [doc.get('_id')]
				});
				docViews[docId].on('rendered', function(){
					me.renderSubview(docViews[docId]);
				});
			});
			this.docViews = docViews;
		},

		render: function(){			
			this.$el.html(this.tpl);
			var table = this.$('table');

			_.each(this.docViews, function(view){
				view.render();				
				table.prepend(view.el.children);
				view.delegateEvents();
			});
		},

		renderSubview: function(subView){
			var id = subView.model.id,
				form = $(document.getElementById('document-editing-' + id)),
				header = $(document.getElementById('document-' + id))
			;
			form.remove();
			header.replaceWith(subView.el.children);
			subView.delegateEvents();

		},

		removeSubView: function(model){
			var id = model.id,
				form = $(document.getElementById('document-editing-' + id)),
				header = $(document.getElementById('document-' + id))
			;
			this.docViews[id].remove();
			delete(this.docViews[id]);
			form.remove();
			header.remove();
		},

		onClickOk: function(e){
			e.preventDefault();
			var	docId = $(e.target).closest('tr').data('id'),
				doc = this.collection.get(docId),
				view = this.docViews[docId],
				me = this,
				stack = {}
			;

			_.each(view.objectView.subViews, function(subView){

				var values = {};
				values['key'] = subView.key;
				values['label'] = subView.label || subView.key;
				values['datatype'] = subView.datatype;
				values['value'] = subView.typeView.getValue();
				stack[subView.key] = values;
				doc.set(values['key'], values['value'], {silent:true});
			});

			doc.save(null, {success: function(){
				Alerts.add({message:'Document saved correctly', autoclose:6000});
				view.render();
				me.trigger('saveDoc', stack);
			}});
		},

		onClickCancel: function(e){
			e.preventDefault();

			var	docId = $(e.target).closest('tr').data('id');
			this.docViews[docId].close();
		},

		onClickField: function(e){
			e.preventDefault();
			var td = $(e.currentTarget),
				docId = td.closest('tr').data('id')
			;
			this.trigger('click:' + td.data('action'), this.docViews[docId]);
		}
	});

	return {
		DocumentView: DocumentView,
		SearchTools: SearchTools,
		NewDocView: NewDocView,
		NewCollectionView: NewCollectionView,
		CollectionView: CollectionView
	};

});
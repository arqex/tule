define(
['jquery', 'underscore', 'backbone', 'text!tpls/collectionList.html'], 
function($,_,Backbone, tplSource){
	return Backbone.View.extend({
		tpl: _.template(tplSource),
		events: {
			'click .createdoc': 'showCreateForm',
			'click .edit': 'showEditForm',
			'click .remove': 'confirmDeleteDoc'
		},

		initialize: function(){
			this.listenTo(this.collection, 'add remove change reset destroy', this.render);
		},

		render: function(){
			this.$el.html(this.tpl({
				type: this.type, 
				docs: this.collection.toJSON(),
				fields: this.collection.fields
			}));
		},

		confirmDeleteDoc: function(e){
			e.preventDefault();
			var me = this,
				docId = $(e.target).closest('tr').data('id'),
				doc = this.collection.get(docId)
			;

			if(confirm('Are you sure to delete this document?'))
				doc.destroy({
					wait: true,
					success: function(){
						console.log('Document deleted');
						me.collection.trigger('destroy');
					},
					error: function(){
						console.log('Document NOT deleted');
					}
				});
			return false;
		}
	});
});
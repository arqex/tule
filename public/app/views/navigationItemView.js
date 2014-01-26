define(['jquery', 'underscore', 'backbone', 'text!tpls/navItem.html'], function($,_,Backbone, tplSource){
	return Backbone.View.extend({
		className: 'navitem',
		tpl: _.template(tplSource),
		render: function(){
			console.log(this.model.toJSON());
			this.$el.html(this.tpl(this.model.toJSON()));
		}
	});
});
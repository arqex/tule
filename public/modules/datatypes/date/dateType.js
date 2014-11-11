var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./dateTypeTpl.html',
	'modules/datatypes/datatypeViews',
	'services',
	'jquery.ui.datepicker',
	'timepicker'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews, Services){
	'use strict';

	var templates = DatatypeViews.DataTypeView.prototype.extractTemplates(tplSource);

	var DateTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: templates.dateTpl,
		editTpl: templates.dateEditTpl,

		initialize: function(){
			var me = this;

			// Apply some defaults while the settings are loaded
			me.dateFormat = 'd/mm/yy';
			me.timeFormat = 'H:mm';
			me.firstDay = 1; // Monday

			me.setDate();

			me.loading = Services.get('settings').get('tule')
				.then(function(settings){
					var tule = settings.value;

					me.dateFormat = tule.dateFormat;
					me.timeFormat = tule.timeFormat;
					me.firstDay = tule.firstDayOfWeek;

					me.setDate();

					me.loading = false;
				})
			;
		},

		setDate: function() {
			var value = this.model.get('value'),
				date = value ? new Date( value ) : value
			;

			// Be sure we work with timestamps
			if( date )
				this.model.set('value', date.getTime());

			this.date = date;
			this.displayDate = date ? this.formatDate(date) : 'Not set';
		},

		render: function() {
			var me = this;

			if(me.loading){
				me.loading.then(function(){
					me.render();
				});
				me.$el.html('Loading...');
			}
			else {
				if(this.state('mode') == 'display')
					this.renderDisplay();
				else
					this.renderEdit();
			}

			return this;
		},

		renderDisplay: function() {
			this.$el.html(this.displayTpl({value: this.displayDate}));
		},

		renderEdit: function() {
			var templateData =  this.getTemplateData(),
				input
			;
			templateData.value = this.displayDate;

			this.$el.html(this.editTpl(templateData));

			input = this.$('input');

			input.datetimepicker({
				showOtherMonths: true,
				selectOtherMonths: true,
				changeMonth: true,
				changeYear: true,
				showTime: false,
				dateFormat: this.dateFormat,
				timeFormat: this.timeFormat,
				firstDay: this.firstDay,
				showButtonPanel: false
			});

			//Wait for rendering and open the datepicker
			setTimeout(function(){
				input.focus();
			}, 50);
		},

		parseDate: function(stringDate) {
			return $.datepicker.parseDateTime(this.dateFormat, this.timeFormat, stringDate);
		},

		formatDate: function(date) {
			var time = {
				hour: date.getHours(),
				minute: date.getMinutes(),
				seconds: date.getSeconds(),
				millisec: date.getMilliseconds()
			};

			return $.datepicker.formatDate(this.dateFormat, date) + ' ' + $.datepicker.formatTime(this.timeFormat, time);
		},

		save: function() {
			var stringDate = this.$('input').val(),
				date = this.parseDate(stringDate),
				value = date.getTime()
			;

			console.log(value);

			this.model.set('value', value);
			this.setDate();
			this.trigger('edit:ok', value);
		},

		getEditValue: function() {
			if(this.state('mode') == 'edit') {
				var stringDate = this.$('input').val();

				return this.parseDate(stringDate).getTime();
			}
			return this.model.get('value');

		}
	});

	return {
		id: 'date',
		name: 'Date',
		defaultValue: '',
		View: DateTypeView
	};

});
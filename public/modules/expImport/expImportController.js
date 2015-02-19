var deps = [
	'jquery', 'underscore', 'backbone', 'services',

	'reactController',
	'curxor',

	'./export.jsx#', './import.jsx#'
];

define(deps, function($,_,Backbone, Services, ReactController, Curxor, Export, Import) {


	var ExpImport = ReactController.extend({
		store: {
			tabs: {
				tabs:[
					{name: 'Export', component: Export, options: {
						collection: '',
						query: '',
						modifiers: '',
						repeatAttribute: '',
						results: []
					}},
					{name: 'Import', component: Import, options: {}}
				],
				tabStore: {},
				currentTab: 'Export'
			}
		},
		componentUrl: 'tule/modules/expImport/expImport.jsx'
	});

	return ExpImport;
});
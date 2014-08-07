module.exports = [
	{route: 'get::settings/:name', controller: 'apiSettings::get'},
	{route: 'put::settings/:name', controller: 'apiSettings::save'},
	{route: 'post::settings/:name', controller: 'apiSettings::save'},
	{route: 'delete::settings/:name', controller: 'apiSettings::remove'},

	{route: 'get::collections', controller: 'apiCollection::list'},
	{route: 'get::collections/:name', controller: 'apiCollection::getStatus'},
	{route: 'put::collections/:name', controller: 'apiCollection::update'},
	{route: 'post::collections', controller: 'apiCollection::create'},
	{route: 'delete::collections/:name', controller: 'apiCollection::remove'},

	{route: 'get::docs/:collection', controller: 'apiDocument::collection'},
	{route: 'post::docs/:collection', controller: 'apiDocument::create'},
	{route: 'get::docs/:collection/:id', controller: 'apiDocument::get'},
	{route: 'put::docs/:collection/:id', controller: 'apiDocument::update'},
	{route: 'delete::docs/:collection/:id', controller: 'apiDocument::remove'},

	{route: 'get::plugins', controller: 'pluginController::list'},
	{route: 'get::plugins/activate/:id', controller: 'pluginController::activate'},
	{route: 'get::plugins/deactivate/:id', controller: 'pluginController::deactivate'},

	{route: 'get::/mongoreset', controller: 'mongoReset::main'},

	{route: '*', controller: 'main'}
];

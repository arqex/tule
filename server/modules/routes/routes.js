module.exports = [
	{route: 'get::settings/:name', controller: 'apiSettings::getConfig'},
	{route: 'put::settings/:name', controller: 'apiSettings::updateConfig'},
	{route: 'post::settings/:name', controller: 'apiSettings::createConfig'},
	{route: 'delete::settings/:name', controller: 'apiSettings::removeConfig'},

	{route: 'get::collections', controller: 'apiCollection::list'},
	{route: 'get::collectionstatus/:name', controller: 'apiCollection::getStatus'},
	{route: 'post::collection', controller: 'apiCollection::createCollection'},

	{route: 'get::docs/:type', controller: 'apiDocument::collection'},
	{route: 'post::docs/:type', controller: 'apiDocument::create'},
	{route: 'get::docs/:type/:id', controller: 'apiDocument::get'},
	{route: 'put::docs/:type/:id', controller: 'apiDocument::update'},
	{route: 'delete::docs/:type/:id', controller: 'apiDocument::remove'},

	{route: 'get::plugins', controller: 'pluginController::list'},
	{route: 'get::plugins/activate/:id', controller: 'pluginController::activate'},
	{route: 'get::plugins/deactivate/:id', controller: 'pluginController::deactivate'},

	{route: 'get::/mongoreset', controller: 'mongoReset::main'},

	{route: '*', controller: 'main'}
];
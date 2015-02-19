var deps = [
	'underscore', 'react', 'curxor', './tabs.jsx#', 'ajax'
];

define( deps, function( _, React, Curxor, Tabs, Ajax ){
	'use strict';

	var ExpImport = React.createClass({
		componentWillMount: function(){
			this.getCollectionNames();
		},

		render: function(){
			var store = this.props.store.get();
			if( !store.tabs.tabStore.collections )
				return <h2 className="loading">Loading...</h2>;

			return (
				<div className="twitter">
					<h2>Export / Import</h2>
					<Tabs store={ store.tabs } />
				</div>
			);
		},

		componentDidMount: function() {
			var me = this,
				store = this.props.store.get()
			;

			this.props.store.on('update', function(){
				me.forceUpdate();
			});
		},

		getCollectionNames: function(){
			var store = this.props.store;

			Ajax.get('/api/collections')
				.then( function( collectionNames ){
					collectionNames.sort();
					var indexesIndex = collectionNames.indexOf( 'system.indexes' );
					if( indexesIndex != -1 )
						collectionNames.splice( indexesIndex, 1 );
					store.get().tabs.tabStore.set( 'collections', collectionNames );
				})
			;
		}
	});

	return ExpImport;
});
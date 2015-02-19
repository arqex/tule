var deps = [
	'underscore', 'react'
];

define( deps, function( _, React ){
	'use strict';

	var Tabs = React.createClass({
		render: function(){
			var me = this,
				store = this.props.store,
				currentTab = this.getTab( store.currentTab ),
				tabNames = store.tabs.map( function(t){
					var className = 'tab';
					if( t == currentTab )
						className += ' currentTab';

					return (
						<a href="#" className={ className } key={t.name} data-name={t.name} onClick={ me.onTabClick }>
							{ t.name[0].toUpperCase() + t.name.slice(1) }
						</a>
					);
				}),
				content = React.createElement( currentTab.component, {
					store: store.tabStore,
					options: typeof currentTab.options == 'function' ? currentTab.options() : currentTab.options
				})
			;

			return (<div className="tabs">
				<div className="tabList">
					{tabNames}
				</div>
				<div className="tabContent">
					{ content }
				</div>
			</div>);
		},

		getTab: function( tabName ){
			var store = this.props.store,
				tab, i = 0
			;

			while( !tab && i < store.tabs.length ){
				if( store.tabs[i].name == tabName )
					tab = store.tabs[i];
				i++;
			}

			return tab || store.tabs[0];
		},

		onTabClick: function( e ){
			this.props.store.set({ currentTab: e.target.dataset.name });
		}
	});

	return Tabs;
});
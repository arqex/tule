var deps = [
	'underscore', 'react', 'curxor', './tabs.jsx#', 'ajax', 'services', 'alerts'
];

define( deps, function( _, React, Curxor, Tabs, Ajax, Services, Alerts ){
	'use strict';

	var Import = React.createClass({

		getInitialState: function(){
			var options = this.props.options;

			return {
				collection: options.collection || this.props.store.collections[0],
				docs: []
			};
		},

		render: function(){
			var store = this.props.store;
			var collections = store.collections.map( function( c ){
				return <option value={ c } key={ c }>{ c }</option>;
			});

			var info = store.dataInfo ? <DataInfo store={ store.dataInfo } /> : '';

			return (
				<div className="export">
					<table style={{width: '100%'}} >
						<tr className="field">
							<td style={{width: '100px'}}>Collection: </td>
							<td><select name="collection" value={ this.state.collection} onChange={ this.onChangeInput }>
								{ collections }
							</select></td>
						</tr>
					</table>
					<textarea name="docs" value={ this.state.docs} onChange={ this.onChangeData } style={{width: '100%', height:'350px', fontFamily: 'monospace', fontSize: '12px'}} />
					<div class="exportControls">
						<button onClick={ this.testData }>Test</button>
						<button onClick={ this.importData }>Go!</button>
					</div>
					{ info }
				</div>
			);
		},

		onChangeData: function( e ){
			if( this.props.store.dataInfo )
				this.props.store.set({dataInfo: false});
			this.onChangeInput( e );
		},

		onChangeInput: function( e ){
			var update = {};

			update[ e.target.name ] = this.getInputValue( e.target );
			this.setState( update );
		},

		getInputValue: function( target ) {
			if( target.type == 'checkbox' )
				return target.checked;
			return target.value;
		},

		testData: function(){
			var docs;

			try {
				docs = JSON.parse('[' + this.state.docs + ']');
			}
			catch( e ){
				return Alerts.add({
					message: 'The data is not valid.',
					level: 'error'
				})
			}

			var cleanData = this.dataClean( docs );
			if( !cleanData ){
				return Alerts.add({
					message: 'There is some error in your docs.',
					level: 'error'
				});
			}

			this.props.store.set({dataInfo: cleanData});
		},

		importData: function(){
			var me = this,
				store = this.props.store
			;

			if( !store.dataInfo ){
				return Alerts.add({
					message: 'You must test the data before import it',
					level: 'warn'
				});
			}

			var dialog = Alerts.add({
				message: 'Are you sure you want to import the data?',
				confirmButtons: {ok: 'Import', cancel: 'Don\'t do it'}
			});

			dialog.once( 'alertOk', function(){
				Ajax.post('/api/import', {
					action: 'importData',
					collection: me.state.collection,
					docs: store.dataInfo.docs.slice()
				})
			});
		},

		dataClean: function( docs ){
			if( !Array.isArray( docs ) )
				return;

			var fields,
				allTheSame = true,
				allObjects = true,
				key
			;

			docs.forEach( function( d ){
				if( !allObjects )
					return;

				allObjects = d.constructor == Object;

				if( !allObjects )
					return;

				// Delete id
				delete d._id;

				if( !fields )
					fields = Object.keys( d );

				if( allTheSame && fields.length == Object.keys( d ).length ){
					for( key in d ){
						if( fields.indexOf( key ) == -1 )
							allTheSame = false;
					}
				}
				else
					allTheSame = false;
			});

			if( !allObjects )
				return;

			return {
				allTheSame: allTheSame,
				fields: fields,
				docs: docs
			};
		}
	});

	var DataInfo = React.createClass({
		render: function(){
			var store = this.props.store;
			return(
				<div>
					<h3>{ store.docs.length } docs</h3>
					<p>Its properties are { store.allTheSame ? '': 'not' } constant</p>
					<code>{ JSON.stringify( store.fields ) }</code>
				</div>
			);
		}
	});

	return Import;
});
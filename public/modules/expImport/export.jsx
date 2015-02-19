var deps = [
	'underscore', 'react', 'curxor', './tabs.jsx#', 'ajax', 'services', 'alerts'
];

define( deps, function( _, React, Curxor, Tabs, Ajax, Services, Alerts ){
	'use strict';

	var Export = React.createClass({

		getInitialState: function(){
			var options = this.props.options;

			return {
				collection: options.collection || this.props.store.collections[0],
				query: options.query,
				modifiers: options.modifiers
			};
		},

		render: function(){
			var store = this.props.store;
			var collections = store.collections.map( function( c ){
				return <option value={ c } key={ c }>{ c }</option>;
			});

			var mergeButton = '',
				cancelButton = ''
			;

			if( store.query && store.results.length ){
				mergeButton = (<button>Go Merge</button>);
				cancelButton = (<button>Cancel</button>);
			}

			return (
				<div className="export">
					<table style={{width: '100%'}} >
						<tr className="field">
							<td style={{width: '100px'}}>Collection: </td>
							<td><select name="collection" value={ this.state.collection} onChange={ this.onChangeInput }>
								{ collections }
							</select></td>
						</tr>
						<tr className="field">
							<td style={{width: '100px'}}>Query: </td>
							<td><input type="text" style={{width: '100%'}} name="query" onChange={ this.onChangeInput } value={ this.state.query } /></td>
						</tr>
						<tr className="field">
							<td style={{width: '100px'}}>Modifiers: </td>
							<td><input type="text" style={{width: '100%'}} name="modifiers" onChange={ this.onChangeInput } value={ this.state.modifiers } /></td>
						</tr>
					</table>
					<div class="exportControls">
						<button onClick={ this.getResults }>Go!</button>
						{ mergeButton }
						{ cancelButton }
					</div>
					<ExportPreview results={this.props.options.results}/>
				</div>
			);
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

		getResults: function(){
			var me = this,
				query = '{' + this.state.query + '}',
				modifiers = '{' + this.state.modifiers + '}',
				error = false,
				regex = /(['"])?([a-zA-Z0-9_$]+)(['"])?:/g
			;

			try{
				query = JSON.parse( query.replace( regex, '"$2":') ),
				modifiers = JSON.parse( modifiers.replace( regex, '"$2":') )
			}
			catch (e){
				Alerts.add({
					message: 'There is an error in your query or modifier',
					level: 'error'
				});
				error = true;
			}
			if( error )
				return;

			Services.get('collection')
				.collection( this.state.collection ).find( query, modifiers )
				.then( function( results ){
					me.props.options.set({
						query: me.state.query,
						modifiers: me.state.modifiers,
						results: results.results.toJSON()
					})
					return results;
				})
			;
		}
	});

	var ExportPreview = React.createClass({
		render: function(){
			var results = this.props.results.map( function( r ){
				return JSON.stringify( r );
			});

			results = results.join(',\n\n');

			return (
				<div className="exportPreview">
					<div className="exportCounter" style={{textAlign: 'right'}}>{ this.props.results.length } docs</div>
					<textarea value={ results } style={{width: '100%', height:'350px', fontFamily: 'monospace', fontSize: '12px'}} />
				</div>
			);
		}
	})

	return Export;
});
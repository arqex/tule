# ClientStore
`ClientStore` let's the developer save temporary data for a particular user. It uses localStorage to save the data on the user computer.

It is very useful to store user preferences. Let's say that we are developing a plugin to let the user pick the background color of tule. The user selected the color `blue`, and using `ClientStore` we can storing it like this:

```js

define( ['clientStore'], function( ClientStore ){
	ClientStore.set('bgPlugin', {color: blue});
});

```

Afterwards we can retrieve the color easily:

```js
define( ['clientStore'], function( ClientStore ){
	var color = ClientStore.get('bgPlugin').color;
});
```

## How it works

ClientStore save the data in browser's localStorage, using JSON stringify function.

It prepends the 'tule-' extension to the name of the property to avoid naming collision with other localStorage usage.

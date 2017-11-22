# Fire2SQL
Use Firebase with a basic SQL-like promise-based syntax.

## Installation
fire2sql is available on npm as firebase-admin:

	$ npm install --save fire2sql

To use the module in your application, require it from any JavaScript file:

	var Fire2SQL = require("fire2sql");

If you are using ES2015, you can import the module instead:

	import Fire2SQL from "fire2sql";

### peerDependencies
*(npm 3 behavior assumed)*

You will need at least one of the following packages to use fire2sql, according to your project structure.

Realtime Database:
- [Firebase Javascript SDK](https://github.com/firebase/firebase-js-sdk)
- [Firebase Admin Node.js SDK](https://github.com/firebase/firebase-admin-node)

Cloud Firestore:
- none

## Examples

Include firebase

	// example using ES2015 syntax
	import * as firebase from 'firebase';
	import * as Fire2SQL from 'fire2sql';

or firebase-admin

	// example using CommonJS syntax
	const admin = require('firebase-admin');
	const Fire2SQL = require('fire2sql');

then, if you properly initialized Firebase, you can pass the "firebase" (or "admin") variable to the constructor.

	new Fire2SQL(firebase)
	.select("*")
	.from("users")
	.where("age", ">=", 18)
	.orderBy("displayName") // --> "orderByChild" will be used
	.limit(10, 1)
	.json()
	.then(console.log).catch(console.error);

	new Fire2SQL(admin)
	.select("*")
	.from("news/politics")
	.where("date", "between", "2017-09-01", "2017-09-31");
	.orderBy("date", "DESC") // --> "orderByChild" will be used
	.json()
	.then(console.log).catch(console.error);

	new Fire2SQL(admin)
	.select("*")
	.from("categories")
	.orderBy(null, "DESC") // --> "orderByValue" will be used
	.json()
	.then(console.log).catch(console.error);

## Formats

**.json()**

Returns the promise of a json object

	{k0: v0, k1: v1, ...}

**.entries()**

Returns the promise of an array of key/value pairs *(similar to Object.entries())*

	[[k0, v0], [k1, v1], ...]

**.object()**

Returns the promise of an object with "keys" and "values" attrubutes *(similar to Object.keys() plus Object.values())*

	{keys: [k0, k1, ...], values: [v0, v1, ...]}

**.map()**

Returns the promise of a Map object

	{k0 => v0, k1 => v1, ...}

**.ref()**

Returns the promise of an array of Firebase references

	[Reference0, Reference1, ...]

**.query()**

Returns the promise of a pure Firebase query (non-native quary options will not be applied)

	Query

## Limitations

### Due to Firebase

- sometime, superfluous (respect to the request) data could be downloaded
- you can perform just only one "when"
- "when" available operators are: "==", ">=", "<=", "between" (inclusive)
- "orderBy" and "limit" could be computed client-side
- no advanced SQL functions support, i.e. aliaes, join, count, distinct, date_format, views, functions, ...
- "select" always return all columns ("*" is used in examples just for readability)
- "from" accepts only one path

### Due to fire2sql

- no advanced Firebase functions support, i.e. transaction, users, priority, ...
- not realtime (under consideration)

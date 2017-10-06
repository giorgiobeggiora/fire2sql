# fire2sql
Use Firebase with a basic SQL-like promise-based syntax.

**Supported APIs for Realtime Database**
- https://github.com/firebase/firebase-admin-node

**Supported APIs for Cloud Firestore**
- none

## Installation
fire2sql is available on npm as firebase-admin:

	$ npm install --save fire2sql

To use the module in your application, require it from any JavaScript file:

	var admin = require("fire2sql");

If you are using ES2015, you can import the module instead:

	import * as admin from "fire2sql";

## Examples

	const admin     = require('firebase-admin');
	const fire2sql  = require('fire2sql');
	
	new fire2sql(admin)
	.select("*").from("users")
	.where("age", ">=", 18)
	.orderBy("displayName") // --> "orderByChild" will be used
	.limit(10, 1)
	.json()
	.then(console.log).catch(console.error);

	new fire2sql(admin)
	.select("*").from("news/politics")
	.where("date", "between", "2017-09-01", "2017-09-31");
	.orderBy("date", "DESC") // --> "orderByChild" will be used
	.json()
	.then(console.log).catch(console.error);

	new fire2sql(admin)
	.select("*")
	.from("categories")
	.orderBy(null, "DESC") // --> "orderByValue" will be used
	.json()
	.then(console.log).catch(console.error);

## Formats

**.json()**

returns a json object

	{k0: v0, k1: v1, ...}

**.entries()**

returns an array of key/value pairs *(similar to Object.entries())*

	[[k0, v0], [k1, v1], ...]

**.object()**

returns an object with "keys" and "values" attrubutes *(similar to Object.keys() plus Object.values())*

	{keys: [k0, k1, ...], values: [v0, v1, ...]}

**.map()**

returns a Map object

	{k0 => v0, k1 => v1, ...}

**.ref()**

returns an array of Firebase references

	[Reference0, Reference1, ...]

**.query()**

returns the pure Firebase query (some option could be not applied)

	Query

## Limitations
	
### Due to Firebase

- sometime superfluous data could be downloaded
- you can perform just only one "when"
- "when" available operators are: "==", ">=", "<=", "between"
- "orderBy" and "limit" could be computed locally
- no advanced SQL functions support, i.e. aliaes, join, views, functions, ...

### Due to fire2sql

- select simple sintax support only (no count, date_format, in, ...)
- select always return all columns ('*' is used in examples just for readability)
- from accepts only one path
- no advanced Firebase functions support, i.e. transaction, users, priority, ...

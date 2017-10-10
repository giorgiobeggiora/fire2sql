class Fire2SQL {

	constructor (...args) {
		const [admin, lang] = args;
		this.admin = admin;
		this.lang = lang || 'en';
		this.db = admin.database();
//		this.auth = admin.auth();
		this.queryParams = {};
		this.queryType = '';
		this.resultType = '';
		this.alreadySorted = false;
		this.alreadyLimited = false;
		return this;
	}

	select (cols) {
		if(!cols) cols = '*';
		this.queryType = 'select';
		this.queryParams = {};
		this.queryParams.select = cols;
		return this;
	}

	from (table) {
		this.queryParams.from = table;
		return this;
	}

	where (...args) {
		const [col, cond, val, val2] = args;
		this.queryParams.where = {col, cond, val, val2};
		return this;
	}

	orderBy (...args) {
		let [col, dir] = args;
		if(!col) col = ''; // if col = '' -> orderByValue
		if(!dir) dir = 'ASC';
		this.queryParams.orderBy = {col, dir};
		return this;
	}

	limit (...args) {
		const [quantity, offset] = args.map(item => +item);
		this.queryParams.limit = {quantity, offset, end: quantity + (offset || 0)};
		return this;
	}

	object	() {	return this.run('object');	}
	json 	() {	return this.run('json');	}
	entries () {	return this.run('entries');	}
	ref 	() {	return this.run('ref');		}
	map 	() {	return this.run('map');		}
	query 	() {	return this.run('query');	}

	run (...args) {
		const [resultType] = args;
		this.resultType = resultType || '';
		const type = this.queryType;
		if(type === 'select') return this.runSelect();
		return Promise.reject('tipo di query non riconosciuto');
	}

	runSelect () {
		return new Promise((resolve, reject) => {

			const params = this.queryParams;
			let query;

			if(!params.where){
				if(!params.orderBy){
					if(params.limit){
						query = this.db.ref(params.from)
						.limitToFirst(params.limit.end);
						this.alreadyLimited = true;
					}else{
						query = this.db.ref(params.from);
					}
					this.alreadySorted = true;
				}else if(params.orderBy.dir === 'ASC'){
					if(params.orderBy.col){
						if(params.limit){
							query = this.db.ref(params.from)
							.orderByChild(params.orderBy.col)
							.limitToFirst(params.limit.end);
							this.alreadyLimited = true;
						}else{
							query = this.db.ref(params.from)
							.orderByChild(params.orderBy.col);
						}
					}else{
						if(params.limit){
							query = this.db.ref(params.from)
							.orderByValue()
							.limitToFirst(params.limit.end);
							this.alreadyLimited = true;
						}else{
							query = this.db.ref(params.from)
							.orderByValue();
						}
					}
					this.alreadySorted = true;
				}else{
					query = this.db.ref(params.from);
				}
			}else{
				switch(params.where.cond.toLowerCase()){
					case '==':
						query = this.db.ref(params.from)
						.orderByChild(params.where.col)
						.equalTo(params.where.val);
					break;
					case '>=':
						query = this.db.ref(params.from)
						.orderByChild(params.where.col)
						.startAt(params.where.val);
					break;
					case '<=':
						query = this.db.ref(params.from)
						.orderByChild(params.where.col)
						.endAt(params.where.val);
					break;
					case 'between':
						query = this.db.ref(params.from)
						.orderByChild(params.where.col)
						.startAt(params.where.val)
						.endAt(params.where.val2);
					break;
					default:
						reject(new Error('You can use only the following operators: "==", ">=", "<=", "between"'));
					break;
				}
			}

			if(!this.resultType){
				resolve(query);
				return;
			}

			query.once('value').then(snap => {
				const arr = [];
				snap.forEach(data => {
					arr.push([data.key, data.val()]);
				});
				return Promise.resolve(arr);
			})
			.then(this.sort.bind(this))
			.then(this.filter.bind(this))
			.then(this.format.bind(this))
			.then(resolve)
			.catch(reject);

		});

	}

	sort (entries) {

		// https://firebase.google.com/docs/database/web/lists-of-data#data-order

		return new Promise((resolve, reject) => {
			if(this.alreadySorted){
				resolve(entries);
				return;
			}

			const params = this.queryParams;
			const col = params.orderBy.col;
			const dir = params.orderBy.dir;

			const mod       = dir === 'ASC' ? 1 : -1;
			const A_BEFORE  = -1 * mod;
			const B_BEFORE  =  1 * mod;
			const UNCHANGED =  0;

			const compareStrings = (a, b) => {
				const diff = a.localeCompare(b, this.lang);
				if(diff < 0)return A_BEFORE;
				if(diff > 0)return B_BEFORE;
				return UNCHANGED;
			}

			const compareNumbers = (a, b) => {
				if(a < b)return A_BEFORE;
				if(a > b)return B_BEFORE;
				return UNCHANGED;
			}

			const compare = (a, b) => {
				const aType = Object.prototype.toString.call(a);
				const bType = Object.prototype.toString.call(b);
				if(aType === "[object String]" && bType === "[object String]") {
					return compareStrings(a, b);
				}
				return compareNumbers(a, b);
			}

			entries.sort((item1, item2) => {

				const a = col ? item1[1][col] : item1[1];
				const b = col ? item2[1][col] : item2[1];
				const aKey = item1[0];
				const bKey = item2[0];
				let check = [], checkLen = 0;

				// null, false, true

				check = [null, false, true], checkLen = check.length;
				for (let i = 0; i < checkLen; i++ ) {
					const c = check[i];
					if (a === c) {
						if (b !== c) return A_BEFORE;
						return compare(aKey, bKey);
					} else if (b === c) {
						return B_BEFORE;
					}
				}

				// number, string

				const aType = Object.prototype.toString.call(a);
				const bType = Object.prototype.toString.call(b);

				check = ["[object Number]", "[object String]"], checkLen = check.length;
				for (let i = 0; i < checkLen; i++ ) {
					const cType = check[i];
					if (aType === cType) {
						if (bType !== cType){
							return A_BEFORE;
						} if (a === b) {
							return compare(aKey, bKey);
						} else {
							return compare(a, b);
						}
					} else if (bType === cType) {
						return B_BEFORE;
					}/*else{
						// check does not match
					}*/
				}

				// objects

				return compare(aKey, bKey);

			});

			// ............

			resolve(entries);
			return;
		});
	}

	filter (entries) {
		return new Promise((resolve, reject) => {
			const params = this.queryParams;
			if (params.limit) {
				resolve(entries.slice(params.limit.offset, params.limit.end));
				return;
			}
			resolve(entries);
		});
	}

	format (entries) {
		return new Promise((resolve, reject) => {
			const len = entries.length;
			let results;
			switch(this.resultType){
				case "entries":
					resolve(entries);
				break;
				case "object":
					const keys = new Array(len);
					const values = new Array(len);
					for (let i = 0; i < len; i++) {
						let entry = entries[i];
						keys[i] = entry[0];
						values[i] = entry[1];
					}
					resolve({keys, values});
				break;
				case "json":
					results = {};
					for (let i = 0; i < len; i++) {
						let entry = entries[i];
						results[entry[0]] = entry[1];
					}
					resolve(results);
				break;
				case "map":
					results = new Map();
					for (let i = 0; i < len; i++) {
						let entry = entries[i];
						results.set(entry[0], entry[1]);
					}
					resolve(results);
				break;
				case "ref":
					results = new Array(len);
					for (let i = 0; i < len; i++) {
						let entry = entries[i];
						results[i] = this.db.ref(this.queryParams.from + '/' + entry[0]);
					}
					resolve(results);
				break;
			}
		});
	}

}

module.exports = Fire2SQL;

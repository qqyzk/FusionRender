export default class listMap {

	constructor() {

		this.map = new Map();

	}
	has( arrayKey ) {
		for (const key of this.map.keys()) {
			if (Array.isArray(key) && key.length === arrayKey.length && key.every((value, index) => value === arrayKey[index])) {
			  return true
			}
		  }
		  return false;
	}


	get( arrayKey ) {
		for (const key of this.map.keys()) {
			if (Array.isArray(key) && key.length === arrayKey.length && key.every((value, index) => value === arrayKey[index])) {
			  return this.map.get(key);
			}
		  }
		  return undefined;
	}

	set( keys, value ) {
		this.map.set( keys, value );
	}

	getmap(){
		return this.map;
	}
	
	keys(){
		return this.map.keys();
	}
}

export default class Events {
	constructor() {
		this.events = new Map();
	}
	on(name, callback) {
		let cbList = this.events.get(name);
		if (!cbList) {
			cbList = new Set();
			this.events.set(name, cbList);
		}
		cbList.add(callback);
	}
	removeOn(name, callback) {
		let cbList = this.events.get(name);
		if (!cbList) return;
		cbList.delete(callback);
	}
	fire(name, ...args) {
		let cbList = this.events.get(name);
		if (!cbList) return;
		for(const cb of cbList) {
			cb(args);
		}
	}
}
import os from "node:os";

function getLocalIp() {
	const interfaces = os.networkInterfaces();
	for(const name in interfaces) {
		const intfc = interfaces[name];
		if (intfc[0] && intfc[0].internal) continue;
		return {
			v4: intfc.find(e => e.family == "IPv4")?.address,
			v6: intfc.find(e => e.family == "IPv6")?.address
		};
	}
	return null;
}

function generateUUID() {
	let lengths = [8, 4, 4, 4, 12];
	let parts = [];
	for(let length of lengths) {
		let part = "";
		for(let i=0; i<length; i++) {
			part += Math.floor(Math.random()*16).toString(16);
		}
		parts.push(part);
	}
	return parts.join("-");
}

function generateMiniUUID() {
	let part = "";
	for(let i=0; i<12; i++) {
		part += Math.floor(Math.random()*16).toString(16);
	}
	return part;
}

export {getLocalIp, generateUUID, generateMiniUUID};
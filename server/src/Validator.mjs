import crypto from "crypto";

class Validator {
	constructor(secret) {
		this.secret = secret;
	}
	toSafe(string) {
		return string.replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
	}
	fromSafe(string) {
		return string.replaceAll("-","+").replaceAll("_","/");
	}
	toEncodedData(object) {
		return this.toSafe(btoa(JSON.stringify(object)));
	}
	sign(payloadStr) {
		const signature = crypto.createHmac("sha256", this.secret);
		signature.update(payloadStr);
		const signatureStr = this.toSafe(signature.digest("base64"));
		return payloadStr+"."+signatureStr;
	}
	check(string, length, type) {
		if (typeof string !== "string") return null;
		const all = string.split(".");
		if (all.length !== length) return null;
		if (all[0] !== type) return null;
		const signatureStr = all.pop();
		const payloadStr = all.join(".");
		const signature = crypto.createHmac("sha256", this.secret);
		signature.update(payloadStr);
		const correctSignatureStr = this.toSafe(signature.digest("base64"));
		if (signatureStr !== correctSignatureStr) return null;
		return all;
	}
}

export default Validator;
export class AuthManager {
	constructor(networkManager) {
		this.networkManager = networkManager;
		this.userTokenChangeCbs = new Set();
		this.userToken = "";
	}
	init() {
		this.networkManager.addHandler("userTokens", this.onMessage.bind(this));
		this.updateUserToken();
	}
	onMessage(op, data) {
		if (op == "setUserTokenGuest") {
			localStorage.setItem("userTokenGuest", data);
			localStorage.removeItem("userTokenOAuth");
			this.updateUserToken();
		}
		if (op == "setUserTokenOAuth") {
			localStorage.setItem("userTokenOAuth", data);
			this.updateUserToken();
		}
		if (op == "signinError") {
			alert("Signin error: "+data);
		}
	}
	updateUserToken() {
		this.userToken = localStorage.getItem("userTokenOAuth") || localStorage.getItem("userTokenGuest") || "";
		for (const cb of this.userTokenChangeCbs) {
			cb(this.userToken);
		}
	}
	onConnect() {
		this.networkManager.send("userToken", this.userToken);
		if (location.hash.length > 1) {
			const params = new URLSearchParams(location.hash.substring(1));
			const state = params.get("state");
			const idToken = params.get("id_token");
			if (!state || !idToken) return;
			this.signInWithGoogleEnd(state, idToken);
			location.hash = "";
		}
	}
	signInWithGoogleEnd(state, idToken) {
		if (!state || !idToken) return;
		const expectedNonce = localStorage.getItem("nonce");
		if (state !== expectedNonce) return;
		this.networkManager.send("googleSignIn", {
			nonce: expectedNonce,
			idToken: idToken,
		});
	}
	signinWithGoogleStart() {
		const nonce = this.generateNonce();
		localStorage.setItem("nonce", nonce);
		const params = {
			response_type: "id_token",
			client_id: "012345678901-0123456789abcdefghijklmnopqrstuv.apps.googleusercontent.com",
			redirect_uri: location.origin,
			scope: "openid",
			state: nonce,
			nonce: nonce,
		};
		let url = "https://accounts.google.com/o/oauth2/v2/auth?";
		url += Object.entries(params).map(([key,value]) => key+"="+encodeURIComponent(value)).join("&");
		window.open(url, "_self");
	}
	signout() {
		localStorage.removeItem("userTokenOAuth");
		this.updateUserToken();
	}
	generateNonce() {
		const chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";
		let out = "";
		for(let i=0; i<32; i++) {
			out += chars[Math.floor(Math.random()*chars.length)];
		}
		return out;
	}
	onUserTokenChange(callback) {
		this.userTokenChangeCbs.add(callback);
	}
	removeOnUserTokenChange(callback) {
		this.userTokenChangeCbs.delete(callback);
	}
}
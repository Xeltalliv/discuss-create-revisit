const mediaCodecs = [
	{
		kind: "audio",
		mimeType: "audio/opus",
		clockRate: 48000,
		channels: 2,
	},
	{
		kind: "video",
		mimeType: "video/VP8",
		clockRate: 90000,
		parameters: {
			"x-google-start-bitrate": 1000,
		},
	},
];


class Conference {
	constructor(main, token) {
		this.main = main;
		this.token = token;
		this.users = new Map();
		this.banned = new Set();
		this.router = null;
		this.makeRouter();
	}
	async makeRouter() {
		const worker = await this.main.getWorker();
		if (!worker) throw new Error("Failed to create a router because there are no workers");
		this.router = await worker.createRouter({mediaCodecs});
		//console.log(this.router.rtpCapabilities);
		this.sendToEveryone("rtpCapabilities", this.router.rtpCapabilities);
	}
	getInfo() {
		return {
			"userCount": this.users.entries
		};
	}
	addUser(user) {
		const id = this.getFreeId();
		user.id = id;
		user.conference = this;
		user.joinTime = Date.now();
		this.sendToEveryone("addUsers", [user.getJoinInfo()]);
		this.users.set(id, user);
		const list = [];
		for(let [_id, otherUser] of this.users) {
			list.push(otherUser.getJoinInfo(user));
		}
		user.send("addUsers", list);
		if (this.router) user.send("rtpCapabilities", this.router.rtpCapabilities);
	}
	removeUserById(id) {
		if (!this.users.get(id)) return;
		this.sendToEveryone("removeUsers", [id]);
		this.users.delete(id);
	}
	sendToEveryone(op, data) {
		for(let [_id, user] of this.users) {
			user.send(op, data);
		}
	}
	sendToEveryoneExcept(op, data, except) {
		for(let [_id, user] of this.users) {
			if (user !== except) user.send(op, data);
		}
	}
	getFreeId() {
		let id = 0;
		while(this.users.get(id)) id++;
		return id;
	}
	isBanned(userId) {
		return this.banned.has(userId);
	}
	banUser(id) {
		const user = this.users.get(id);
		if (!user) return;
		this.banned.add(user.userId);
		user.send("disconnect", {"reason": "banned by host"});
		user.ws.close();
	}
	kickUser(id) {
		const user = this.users.get(id);
		if (!user) return;
		user.send("disconnect", {"reason": "kicked by host"});
		user.ws.close();
	}
	renameUser(id, newName) {
		const user = this.users.get(id);
		if (!user) return;
		user.rename(newName);
	}
	renameBoard(userId, boardId, newName) {
		const user = this.users.get(userId);
		if (!user) return;
		user.renameBoard(boardId, newName);
	}
	deleteBoard(userId, boardId) {
		const user = this.users.get(userId);
		if (!user) return;
		user.deleteBoard(boardId);
	}
	getBoard(userId, boardId) {
		const user = this.users.get(userId);
		if (!user) return;
		return user.getBoard(boardId);
	}
	requestBoardEdit(userId, boardId, sender) {
		const user = this.users.get(userId);
		if (!user) return;
		user.requestBoardEdit(boardId, sender);
	}
	dropBoardEdit(userId, boardId, sender) {
		const user = this.users.get(userId);
		if (!user) return;
		user.dropBoardEdit(boardId, sender);
	}
	txtBoardApplyTransform(userId, boardId, transform, sender) {
		const user = this.users.get(userId);
		if (!user) return;
		user.txtBoardApplyTransform(boardId, transform, sender);
	}
	imgBoardNewLine(userId, boardId, data, sender, replyId) {
		const user = this.users.get(userId);
		if (!user) return;
		user.imgBoardNewLine(boardId, data, sender, replyId);
	}
	imgBoardDeleteLine(userId, boardId, lineId) {
		const user = this.users.get(userId);
		if (!user) return;
		user.imgBoardDeleteLine(boardId, lineId);
	}
	closeConsumerTransport(closeId) {
		for(let [_id, user] of this.users) {
			user.closeConsumerTransport(closeId);
		}
	}
}

export default Conference;
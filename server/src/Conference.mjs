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

export class Conference {
	constructor(main, token) {
		this.main = main;
		this.token = token;
		this.id = token.split(".")[1];
		this.users = new Map();
		this.waitingUsers = new Map();
		this.banned = new Set();
		this.worker = null;
		this.router = null;
		this.settings = {
			joinMode: "open",
			requireSignin: false,
		};
		this.main.conferences.set(token, this);
		this.main.uploads.addConferenceId(this.id);
		this.makeRouter();
	}
	async makeRouter() {
		const worker = await this.main.getWorker();
		if (!worker) throw new Error("Failed to create a router because there are no workers");
		this.worker = worker;
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
		const id = this.getFreeId(this.users);
		user.id = id;
		this.sendToEveryone("addUsers", [user.getJoinInfo()]);
		this.users.set(id, user);
		const list = [];
		const waitingList = [];
		for(let [_id, otherUser] of this.users) {
			list.push(otherUser.getJoinInfo(user));
		}
		for(let [_id, otherUser] of this.waitingUsers) {
			waitingList.push(otherUser.getWaitInfo());
		}
		user.send("conferenceSettings", this.settings);
		user.send("addUsers", list);
		user.send("addWaitingUsers", waitingList);
		if (this.router) user.send("rtpCapabilities", this.router.rtpCapabilities);
	}
	addWaitingUser(user) {
		const id = this.getFreeId(this.waitingUsers);
		user.id = id;
		this.sendToEveryone("addWaitingUsers", [user.getWaitInfo()]);
		this.waitingUsers.set(id, user);
	}
	removeUserById(id) {
		if (!this.users.get(id)) return;
		this.sendToEveryone("removeUsers", [id]);
		this.users.delete(id);
		if (this.users.size == 0) {
			this.destroy();
		}
	}
	removeWaitingUserById(id) {
		if (!this.waitingUsers.get(id)) return;
		this.sendToEveryone("removeWaitingUsers", [id]);
		this.waitingUsers.delete(id);
	}
	onWorkerStopped() {
		for(let [_id, user] of this.users) {
			user.invalidateDeadObjects();
		}
		this.router = null;
		this.worker = null;
		this.destroy();
	}
	destroy() {
		if (this.router) this.router.close();
		this.main.conferences.delete(this.token);
		this.main.uploads.removeConferenceId(this.id);
		for(let [_id, user] of this.users) {
			user.send("disconnect", {"reason": "Conference ended"});
			user.ws.close();
		}
		for(let [_id, user] of this.waitingUsers) {
			user.send("disconnect", {"reason": "Conference ended"});
			user.ws.close();
		}
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
	getFreeId(map) {
		let id = 0;
		while(map.get(id)) id++;
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
	kickWaitingUser(id) {
		const user = this.waitingUsers.get(id);
		if (!user) return;
		user.send("disconnect", {"reason": "rejected by host"});
		user.ws.close();
	}
	acceptWaitingUser(id) {
		const user = this.waitingUsers.get(id);
		if (!user) return;
		this.sendToEveryone("removeWaitingUsers", [id]);
		this.waitingUsers.delete(id);
		user.acceptWaiting();
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
	moveBoards(userId, boardIds, folderId) {
		const user = this.users.get(userId);
		if (!user) return;
		user.moveBoards(boardIds, folderId);
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
	txtBoardSetDisplayMode(userId, boardId, displayMode, sender) {
		const user = this.users.get(userId);
		if (!user) return;
		user.txtBoardSetDisplayMode(boardId, displayMode, sender);
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
	setSettings(settings) {
		this.settings = settings;
		this.sendToEveryone("conferenceSettings", settings);
	}
}

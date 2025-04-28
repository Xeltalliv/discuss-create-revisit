import Conference from "./Conference.mjs";
import BoardTxt from "./BoardTxt.mjs";
import BoardImg from "./BoardImg.mjs";
import BoardFolder from "./BoardFolder.mjs";
import { generateMiniUUID, generateUserId, generateRandomUserId } from "./Utils.mjs";
import { apply } from "./TextDiff.mjs";

class User {
	constructor(main, ws) {
		this.main = main;
		this.ws = ws;
		this.wsid = 0;
		this.replyHandlers = new Map();
		this.conference = null;
		this.name = "";
		this.userId = null;
		this.userType = "guest";
		this.id = null;
		this.joinTime = 0;
		this.handRaiseTime = 0;
		this.isHost = false;
		this.boards = new Map();
		this.nextBoardId = 0;
		this.editsBoard = null;
		this.state = "nothing";
		this.confToken = null;
		this.lastLine = {
			userId: null,
			boardId: null,
			line: null
		};
		this.producerIds = {
			camera: null,
			microphone: null,
			screenshareVideo: null,
			screenshareAudio: null,
		};
		this.producerTransport = null;
		this.producers = new Map();
		this.consumerTransports = new Map();
		this.consumers = new Map();
		ws.on("message", this.handle.bind(this));
		ws.on("close", this.disconnect.bind(this));
	}
	async handle(buffer) {
		const raw = JSON.parse(buffer.toString());
		const op = raw.op;
		const data = raw.data;
		const replyId = raw.id;

		if (raw.reply) {
			let rh = this.replyHandlers.get(raw.reply);
			if (rh) rh(raw);
		}

		if (op == "userToken") {
			let decoded = this.main.validator.check(data, 4, "U");
			if (decoded) {
				this.userType = decoded[1];
				this.userId = decoded[2];
			} else {
				this.userType = "guest";
				this.userId = generateRandomUserId();
				this.send("setUserTokenGuest", this.main.validator.sign("U.guest."+this.userId));
			}
		}
		if (op == "googleSignIn") {
			if (typeof data.idToken !== "string") {
				this.send("signinError", "invalid idToken", replyId);
				return;
			}
			// TODO: replace with offline check using google's public keys, as recommended in docs
			const res = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+data.idToken);
			const payload = await res.json();
			const expected = {
				"aud": this.main.config.auth.google.clientId,
				"azp": this.main.config.auth.google.clientId,
				"iss": "https://accounts.google.com",
				"nonce": data.nonce,
			};
			for(let key in expected) {
				if (payload[key] !== expected[key]) {
					this.send("signinError", "invalid "+key, replyId);
					return;
				}
			}
			this.userId = generateUserId("google"+payload.sub);
			this.userType == "google";
			this.send("setUserTokenOAuth", this.main.validator.sign("U.google."+this.userId));
		}
		if (op == "test") {
			this.send("success");
		}
		if (op == "confInfo") {
			const conference = this.main.conferences.get(data.confToken);
			if (conference) {
				this.send("confInfo", conference.getInfo(), replyId);
			} else {
				this.send("error", "not found", replyId);
			}
		}
		if (op == "confJoin") {
			if (typeof data.name !== "string") {
				this.send("error", "invalid name", replyId);
				return;
			}
			if (data.name.length > 30 || data.name.length < 3) {
				this.send("error", "invalid name length", replyId);
				return;
			}
			let decoded = this.main.validator.check(data.confToken, 4, "C");
			if (!decoded) {
				this.send("error", "invalid token", replyId);
				return;
			}
			let conference = this.main.conferences.get(data.confToken);
			if (!conference) {
				if (decoded[2] !== this.userId) {
					this.send("error", "not active", replyId);
					return;
				}
				conference = new Conference(this.main, data.confToken);
			}
			if (conference.settings.requireSignin && this.userType == "guest") {
				this.send("error", "This conference requires signin", replyId);
				return;
			}
			if (conference.isBanned(this.userId)) {
				this.send("error", "banned", replyId);
				return;
			}
			if (conference.settings.joinMode == "open") {
				this.send("confJoin", {"confToken": data.confToken}, replyId);
				this.confToken = data.confToken;
				this.name = data.name;
				this.isHost = decoded[2] == this.userId;
				this.conference = conference;
				this.joinTime = Date.now();
				this.state = "joined";
				conference.addUser(this);
			} else if (conference.settings.joinMode == "invite") {
				this.send("confWait", {"confToken": data.confToken}, replyId);
				this.confToken = data.confToken;
				this.name = data.name;
				this.isHost = decoded[2] == this.userId;
				this.conference = conference;
				this.joinTime = Date.now();
				this.state = "waiting";
				conference.addWaitingUser(this);
			} else {
				this.send("error", "Conference is closed from joining", replyId);
				return;
			}
		}
		if (op == "confCreate") {
			const confId = generateMiniUUID();
			const confToken = this.main.validator.sign("C."+confId+"."+this.userId);
			this.send("confCreate", {"confToken": confToken}, replyId);
		}
		if (this.state !== "joined") return;
		const conference = this.conference;

		if (op == "chat") {
			//data.text = Array.from(conference.users.values()).map(u => `${u.id}: pTr: ${u.producerTransport ? u.producerTransport.id : null} cTr: ${JSON.stringify(Object.fromEntries(Array.from(u.consumerTransports.entries()).map(e => [e[0], e[1].id])))}`).join("\n")
			conference.sendToEveryone("chat", {"authorId":this.id, "text":data.text.toString(), "files":data.files});
		}
		if (op == "conferenceSettings" && this.isHost) {
			conference.setSettings(data);
		}
		if (op == "raiseHand") {
			const time = this.handRaiseTime == 0 ? Date.now() : 0;
			this.handRaiseTime = time;
			conference.sendToEveryone("raiseHand", {"userId":this.id, "time":time});
		}
		if (op == "banUser" && this.isHost) {
			conference.banUser(data.userId);
		}
		if (op == "kickUser" && this.isHost) {
			conference.kickUser(data.userId);
		}
		if (op == "declineWaitingUser" && this.isHost) {
			conference.kickWaitingUser(data.userId);
		}
		if (op == "acceptWaitingUser" && this.isHost) {
			conference.acceptWaitingUser(data.userId);
		}
		if (op == "endConf" && this.isHost) {
			conference.destroy();
		}
		if (op == "renameUser" && (this.isYou || this.isHost)) {
			conference.renameUser(data.userId, data.newName);
		}
		if (op == "createBoard") {
			const id = ++this.nextBoardId;
			let board, orig;
			let type = data.type;
			if (data.type == "copy") {
				orig = conference.getBoard(data.userId, data.boardId);
				type = orig.type;
				if (!orig) return;
			}
			if (type == "txt") board = new BoardTxt(id, this.id, data);
			if (type == "img") board = new BoardImg(id, this.id, data);
			if (type == "folder") board = new BoardFolder(id, this.id, data);
			if (!board) return;
			if (data.type == "copy") {
				board.copyFrom(orig);
			}
			this.boards.set(id, board);
			conference.sendToEveryone("setBoard", {"userId":this.id, "boardId":id, "board":board.getPublicData()});
			this.send("checkBoard", {"userId":this.id, "boardId":id});
		}
		if (op == "renameBoard") {
			conference.renameBoard(data.userId, data.boardId, data.newName);
		}
		if (op == "deleteBoard") {
			conference.deleteBoard(data.userId, data.boardId);
		}
		if (op == "moveBoards") {
			conference.moveBoards(data.userId, data.boardIds, data.folderId);
		}
		if (op == "editsBoard") {
			this.editsBoard = data;
			conference.sendToEveryone("editsBoard", {userId: this.id, board: data});
		}
		if (op == "requestBoardEdit") {
			conference.requestBoardEdit(data.userId, data.boardId, this);
		}
		if (op == "dropBoardEdit") {
			conference.dropBoardEdit(data.userId, data.boardId, this);
		}
		if (op == "txtBoardApplyTransform") {
			conference.txtBoardApplyTransform(data.userId, data.boardId, data.transform, this);
		}
		if (op == "txtBoardSetDisplayMode") {
			conference.txtBoardSetDisplayMode(data.userId, data.boardId, data.displayMode, this);
		}
		if (op == "imgBoardNewLine") {
			conference.imgBoardNewLine(data.userId, data.boardId, data, this, replyId);
		}
		if (op == "imgBoardDeleteLine") {
			conference.imgBoardDeleteLine(data.userId, data.boardId, data.lineId);
		}
		if (op == "points") {
			this.lastLine.line.addPoints(data);
			conference.sendToEveryone("points", {
				"userId": this.lastLine.userId,
				"boardId": this.lastLine.boardId,
				"lineId": this.lastLine.line.id,
				"points": data
			});
		}





		if (op == "createTransport") {
			const options = {
				listenIps: this.main.listenIps,
				enableUdp: true,
				enableTcp: true,
				preferUdp: true
			};
			const transport = await conference.router.createWebRtcTransport(options);
			transport.on("dtlsstatechange", dtlsState => {
				if (dtlsState == "closed") {
					transport.close();
				}
			});
			transport.on("close", () => { // dtlsState
				//console.log("transport closed");
				if (data.type == "producer") {
					this.producerTransport = null;
				} else {
					this.consumerTransports.delete(data.userId);
				}
			});
			this.send("createTransport", {
				id: transport.id,
				iceParameters: transport.iceParameters,
				iceCandidates: transport.iceCandidates,
				dtlsParameters: transport.dtlsParameters,
			}, replyId);
			
			if (data.type == "producer") {
				this.producerTransport = transport;
			} else {
				this.consumerTransports.set(data.userId, transport);
			}
		}
		if (op == "producerTransportConnect") {
			this.producerTransport.connect(data);
		}
		if (op == "consumerTransportConnect") {
			this.consumerTransports.get(data.userId).connect(data);
		}
		if (op == "producerTransportProduce") {
			const producer = await this.producerTransport.produce({
				kind: data.kind,
				rtpParameters: data.rtpParameters
			});
			//console.log("producer id", producer.id, "kind", producer.kind, "appData", producer.appData);
			producer.on("trackended", () => {
				//console.log("track ended");
				producer.close();
			});
			producer.on("transportclose", () => {
				//console.log("transport closed");
				producer.close();
			});
			this.send("producerTransportProduce", producer.id, replyId);
			conference.sendToEveryone("setProducerId", {
				userId: this.id,
				producerId: producer.id,
				type: data.appData.mediaType
			});
			this.producerIds[data.appData.mediaType] = producer.id;
			this.producers.set(producer.id, producer);
			producer.observer.on("close", () => {
				this.producers.delete(producer.id);
				for(const name of this.producerIds) {
					if (this.producerIds[name] == producer.id) this.producerIds[name] = null;
				}
				//console.log("producer with id", producer.id, "closed. Remaining:", this.producers);
				conference.sendToEveryone("clearProducer", producer.id);
			});
		}
		if (op == "closeProducer") {
			const producer = this.producers.get(data);
			if (!producer) return; // Could've closed on it's own before client realised that
			producer.close();
		}
		if (op == "closeProducerTransport") {
			//console.log("producer transport closed");
			this.producerTransport.close();
			this.producerTransport = null;
			conference.closeConsumerTransport(this.id);
		}
		if (op == "closeConsumerTransport") {
			this.closeConsumerTransport(data);
		}
		if (op == "consume") {
			if (conference.router.canConsume({
				producerId: data.producerId,
				rtpCapabilities: data.rtpCapabilities,
			})) {
				const consumer = await this.consumerTransports.get(data.userId).consume({
					producerId: data.producerId,
					rtpCapabilities: data.rtpCapabilities,
					pasued: true,
				});
				consumer.on("transportclose", () => {
					//console.log("transport closed");
					consumer.close();
				});
				consumer.on("producerclose", () => {
					//console.log("producer of consumer closed");
					consumer.close();
				});
				this.consumers.set(consumer.id, consumer);
				consumer.observer.on("close", () => {
					this.consumers.delete(consumer.id);
					//console.log("consumer with id", consumer.id, "closed, Remianing:", this.consumers);
					this.send("closeConsumer", consumer.id);
				});
				this.send("consume", {
					id: consumer.id,
					producerId: data.producerId,
					kind: consumer.kind,
					rtpParameters: consumer.rtpParameters,
				}, replyId);
			}
		}
		if (op == "consumerResume") {
			const consumer = this.consumers.get(data);
			if (!consumer) return;
			consumer.resume();
		}
	}
	acceptWaiting() {
		this.send("confJoin", {"confToken": this.confToken});
		this.state = "joined";
		this.conference.addUser(this);
	}
	disconnect() {
		if (this.state == "joined") {
			this.conference.removeUserById(this.id);
			for(let [_id, consumer] of this.consumers) {
				consumer.close();
			}
			for(let [_id, producer] of this.producers) {
				producer.close();
			}
			if (this.producerTransport) this.producerTransport.close();
			for(let [_userId, consumerTransport] of this.consumerTransports) {
				consumerTransport.close();
			}
		}
		if (this.state == "waiting") {
			this.conference.removeWaitingUserById(this.id);
		}
	}
	invalidateDeadObjects() {
		this.producers.clear();
		this.consumers.clear();
		this.producerTransport = null;
		this.consumerTransports.clear();
		this.state = "dead";
	}
	send(op, json={}, reply) {
		const all = {
			"op": op,
			"id": this.wsid++,
			"data": json
		};
		if (reply) all.reply = reply;
		this.ws.send(JSON.stringify(all));
	}
	sendAndWaitForReply(op, json={}) {
		const replyId = this.wsid;
		this.send(op, json);
		return new Promise((res, rej) => {
			const timeout = setTimeout(() => {
				this.replyHandlers.delete(replyId);
				rej("WS reply timeout");
			}, 10000);
			this.replyHandlers.set(replyId, (raw) => {
				this.replyHandlers.delete(replyId);
				clearTimeout(timeout);
				res(raw);
			});
		});
	}
	renameBoard(boardId, newName) {
		const board = this.boards.get(boardId);
		if (!board) return;
		board.name = newName;
		this.conference.sendToEveryone("renameBoard", {"userId":this.id, "boardId":boardId, "newName":newName});
	}
	deleteBoard(boardId) {
		if (!this.boards.has(boardId)) return;
		this.boards.delete(boardId);
		this.conference.sendToEveryone("deleteBoard", {"userId":this.id, "boardId":boardId});
	}
	moveBoards(boardIds, folderId) {
		for(const boardId of boardIds) {
			const board = this.boards.get(boardId);
			if (!board) continue;
			board.folderId = folderId;
		}
		this.conference.sendToEveryone("moveBoards", {"userId":this.id, "boardIds":boardIds, "folderId":folderId});
	}
	getBoard(boardId) {
		return this.boards.get(boardId);
	}
	requestBoardEdit(boardId, requester) {
		const board = this.boards.get(boardId);
		if (!board) return;
		if (board.editorId !== null) return;
		board.setEditorId(this.conference, requester.id);
	}
	dropBoardEdit(boardId, requester) {
		const board = this.boards.get(boardId);
		if (!board) return;
		if (board.editorId !== requester.id) return;
		board.setEditorId(this.conference, null);
	}
	txtBoardApplyTransform(boardId, transform, sender) {
		const board = this.boards.get(boardId);
		if (!board) return;
		if (board.editorId !== sender.id) return;
		board.timeout(this.conference);
		board.data = apply(board.data, transform);
		this.conference.sendToEveryoneExcept("txtBoardApplyTransform", {"userId":this.id, "boardId":boardId, "transform":transform}, sender);
	}
	txtBoardSetDisplayMode(boardId, displayMode, sender) {
		const board = this.boards.get(boardId);
		if (!board) return;
		board.displayMode = displayMode;
		this.conference.sendToEveryoneExcept("txtBoardSetDisplayMode", {"userId":this.id, "boardId":boardId, "displayMode":displayMode}, sender);
	}
	imgBoardNewLine(boardId, data, requester, replyId) {
		const board = this.boards.get(boardId);
		if (!board) return;
		const line = board.createLine(data);
		requester.lastLine.line = line;
		requester.lastLine.userId = this.id;
		requester.lastLine.boardId = boardId;
		this.conference.sendToEveryone("imgBoardNewLine", {"userId":this.id, "boardId":boardId, ...line.getCreationData()});
		requester.send("lineId", line.id, replyId);
	}
	imgBoardDeleteLine(boardId, lineId) {
		const board = this.boards.get(boardId);
		if (!board) return;
		const deleted = board.deleteLine(lineId);
		if (deleted) this.conference.sendToEveryone("imgBoardDeleteLine", {"userId":this.id, "boardId":boardId, "lineId":lineId});
	}
	getJoinInfo(user) {
		return {
			id: this.id,
			name: this.name,
			isYou: this == user,
			isHost: this.isHost,
			joinTime: this.joinTime,
			handRaiseTime: this.handRaiseTime,
			editsBoard: this.editsBoard,
			producerIds: {
				camera:           this.producerIds.camera,
				microphone:       this.producerIds.microphone,
				screenshareVideo: this.producerIds.screenshareVideo,
				screenshareAudio: this.producerIds.screenshareAudio,
			},
			boards: Array.from(this.boards.entries()).sort((a,b)=>a[0]-b[0]).map(e=>e[1].getPublicData())
		};
	}
	getWaitInfo() {
		return {
			id: this.id,
			name: this.name,
			joinTime: this.joinTime,
		};
	}
	closeConsumerTransport(id) {
		if (this.consumerTransports.has(id)) {
			//console.log("consumer transport closed");
			this.consumerTransports.get(id).close();
			this.consumerTransports.delete(id);
			this.send("closeConsumerTransport", id);
		}
	}
	rename(newName) {
		this.name = newName;
		this.conference.sendToEveryone("renameUser", {userId: this.id, newName: newName});
	}
}

export default User;
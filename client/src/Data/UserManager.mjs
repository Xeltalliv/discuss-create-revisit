import { BoardTxt, BoardImg, BoardFolder } from "./Boards.mjs";

const BoardTypes = {
	"txt": BoardTxt,
	"img": BoardImg,
	"folder": BoardFolder,
};

class WaitingUser {
	constructor(data) {
		this.isWaiting = true;
		this.id = data.id;
		this.name = data.name;
		this.joinTime = data.joinTime;
	}
}

class User {
	constructor(data) {
		this.isWaiting = false;
		this.id = data.id;
		this.name = data.name;
		this.isYou = data.isYou;
		this.isHost = data.isHost;
		this.joinTime = data.joinTime;
		this.handRaiseTime = data.handRaiseTime;
		this.boards = new Map();
		this.editsBoard = data.editsBoard;
		for(const b of data.boards) {
			this.boards.set(b.id, new BoardTypes[b.type](b.id, data.id, b));
		}
		this.consumerTransport = null;
		this.media = {
			camera: {
				producerId: data.producerIds.camera,
				consumer: null,
				track: null,
				visible: false,
			},
			microphone: {
				producerId: data.producerIds.microphone,
				consumer: null,
				track: null,
				visible: false,
			},
			screenshareVideo: {
				producerId: data.producerIds.screenshareVideo,
				consumer: null,
				track: null,
				visible: false,
			},
			screenshareAudio: {
				producerId: data.producerIds.screenshareAudio,
				consumer: null,
				track: null,
				visible: false,
			},
		};
		this.mediaStreamPrimary = null;
		this.mediaStreamSecondary = null;
		this.isVisible = false;
		this.onMediaUpdate = null;
		this.audio = new Audio();
		this.audioTrack = null;
		this.audio.autoplay = true;
	}
	mediaUpdate(mediasoup) {
		if (this.media.microphone.track) {
			if(this.media.microphone.track !== this.audioTrack) this.audio.srcObject = new MediaStream([this.media.microphone.track]);
		} else {
			if (this.audioTrack) this.audio.srcObject = null;
		}
		this.audioTrack = this.media.microphone.track;

		let mediaStreams = [];
		if (this.isYou) {
			if (mediasoup.userMediaVideo) mediaStreams.unshift([mediasoup.userMediaVideo.getVideoTracks()[0]]);
			if (mediasoup.userMediaScreen) mediaStreams.unshift([mediasoup.userMediaScreen.getVideoTracks()[0]]);
		} else {
			if (this.media.camera.track) mediaStreams.unshift([this.media.camera.track]);
			if (this.media.screenshareVideo.track) mediaStreams.unshift([this.media.screenshareVideo.track, this.media.screenshareAudio.track]);
		}
		const u1 = this.updateMediaStream("mediaStreamPrimary", mediaStreams[0]);
		const u2 = this.updateMediaStream("mediaStreamSecondary", mediaStreams[1]);
		if ((u1 || u2) && this.onMediaUpdate) this.onMediaUpdate();
	}
	updateMediaStream(mediaStreamName, newTracks=[]) {
		newTracks = newTracks.filter(e => e);
		const mediaStream = this[mediaStreamName];
		let update = false;
		if (newTracks.length == 0) {
			if (mediaStream) {
				this[mediaStreamName] = null;
				update = true;
			}
		} else {
			if (!mediaStream) {
				this[mediaStreamName] = new MediaStream(newTracks);
				update = true;
			} else {
				let oldTracks = mediaStream.getTracks();
				let toRemove = oldTracks.filter(t => !newTracks.includes(t));
				let toAdd = newTracks.filter(t => !oldTracks.includes(t));
				for(let track of toRemove) {
					mediaStream.removeTrack(track);
				}
				for(let track of toAdd) {
					mediaStream.addTrack(track);
				}
				update = toAdd.length || toRemove.length;
			}
		}
		return update;
	}
	getBoardType(boardId) {
		return this.boards.get(boardId)?.type ?? null;
	}
}

export class UserManager {
	constructor(networkManager, baseUI) {
		this.baseUI = baseUI;
		this.networkManager = networkManager;
		this.users = new Map();
		this.waitingUsers = new Map();
		this.me = null;
	}
	init() {
		this.networkManager.addHandler("users", this.onMessage.bind(this));
	}
	onMessage(op, data) {
		if (op == "addUsers") {
			for(const user of data) {
				const userObject = new User(user);
				this.users.set(user.id, userObject);
				if (user.isYou) {
					this.updateMe(userObject);
					this.me = userObject;
				}
			}
			this.updateUserList();
		}
		if (op == "removeUsers") {
			for(const userId of data) {
				this.users.delete(userId);
			}
			this.updateUserList();
		}
		if (op == "addWaitingUsers") {
			for(const user of data) {
				const userObject = new WaitingUser(user);
				this.waitingUsers.set(user.id, userObject);
			}
			this.updateUserList();
		}
		if (op == "removeWaitingUsers") {
			for(const userId of data) {
				this.waitingUsers.delete(userId);
			}
			this.updateUserList();
		}
		if (op == "raiseHand") {
			const user = this.users.get(data.userId);
			user.handRaiseTime = data.time;
			if (user.isYou) this.updateMyHandState(data.time > 0);
			this.updateUserList();
		}
		if (op == "renameUser") {
			this.users.get(data.userId).name = data.newName;
			this.updateUserList();
		}
		if (op == "setBoard") {
			const user = this.users.get(data.userId);
			if (!user) return;
			user.boards.set(data.boardId, new BoardTypes[data.board.type](data.boardId, data.userId, data.board));
			this.updateBoardsOf(user);
		}
		if (op == "checkBoard") {
			const user = this.users.get(data.userId);
			if (!user) return;
			const board = user.boards.get(data.boardId);
			if (!board) return;
			this.baseUI.topMain.selectBoard(user, board);
		}
		if (op == "editsBoard") {
			const user = this.users.get(data.userId);
			if (!user) return;
			user.editsBoard = data.board;
			this.updateUserList();
		}
		if (op == "renameBoard") {
			const user = this.users.get(data.userId);
			if (!user) return;
			const board = user.boards.get(data.boardId);
			if (!board) return;
			board.name = data.newName;
			this.updateBoardsOf(user);
		}
		if (op == "deleteBoard") {
			const user = this.users.get(data.userId);
			if (!user) return;
			user.boards.delete(data.boardId);
			this.updateBoardsOf(user);
		}
		if (op == "moveBoards") {
			const user = this.users.get(data.userId);
			if (!user) return;
			for(const boardId of data.boardIds) {
				const board = user.boards.get(boardId);
				if (!board) continue;
				board.folderId = data.folderId;
			}
			this.updateBoardsOf(user);
		}
		if (op == "setBoardEditorId") {
			const user = this.users.get(data.userId);
			if (!user) return;
			const board = user.boards.get(data.boardId);
			if (!board) return;
			board.editorId = data.editorId;
			this.updateBoardEditor(user, board);
		}

		if (op == "txtBoardApplyTransform") {
			const user = this.users.get(data.userId);
			if (!user) return;
			const board = user.boards.get(data.boardId);
			if (!board) return;
			board.transformText(data.transform);
			if (board.upToDate) this.updateBoardText(user, board);
		}
		if (op == "txtBoardSetDisplayMode") {
			const user = this.users.get(data.userId);
			if (!user) return;
			const board = user.boards.get(data.boardId);
			if (!board) return;
			board.displayMode = data.displayMode;
			this.updateBoardDisplayMode(user, board);
		}
		if (op == "imgBoardNewLine") {
			const user = this.users.get(data.userId);
			if (!user) return;
			const board = user.boards.get(data.boardId);
			if (!board) return;
			board.addLineFromWS(data);
		}
		if (op == "imgBoardDeleteLine") {
			const user = this.users.get(data.userId);
			if (!user) return;
			const board = user.boards.get(data.boardId);
			if (!board) return;
			board.deleteLine(data.lineId);
			this.updateBoardImage(user, board);
		}
		if (op == "points") {
			const user = this.users.get(data.userId);
			if (!user) return;
			const board = user.boards.get(data.boardId);
			if (!board) return;
			board.addPoints(data.lineId, data.points);
			this.updateBoardImage(user, board);
		}
	}
	reset() {
		this.users.clear();
	}
	destroy() {
		this.networkManager.removeHandler("users");
	}
	get(id) {
		return this.users.get(id);
	}
	updateUserList() {
		const users = Array.from(this.users.values());
		const waitingUsers = Array.from(this.waitingUsers.values());
		
		for(const user of users) {
			user.isVisible = false;
			user.onMediaUpdate = null;
		}
		this.baseUI.rightPanel.userlistUI.setUsers(users, waitingUsers);
		this.baseUI.topMain.setUsers(users);
		this.baseUI.mediasoup.refreshUserVisibility(users);
	}
	updateBoardsOf(user) {
		if (this.baseUI.rightPanel.boardsUI.user == user) {
			this.baseUI.rightPanel.boardsUI.updateBoards();
		}
	}
	updateBoardText(user, board) {
		if (this.baseUI.topMain.btxtUI.board == board) {
			this.baseUI.topMain.btxtUI.updateText();
		}
	}
	updateBoardDisplayMode(user, board) {
		if (this.baseUI.topMain.btxtUI.board == board) {
			this.baseUI.topMain.btxtUI.updateDisplayMode();
			this.baseUI.topMain.btxtUI.updateMarkdown();
			this.baseUI.rightPanel.writeUI.updateDisplayMode();
		}
	}
	updateBoardImage(user, board) {
		if (this.baseUI.topMain.bimgUI.board == board) {
			this.baseUI.topMain.bimgUI.updateImage();
		}
	}
	updateBoardEditor(user, board) {
		if (this.baseUI.topMain.btxtUI.board == board) {
			this.baseUI.topMain.btxtUI.updateEditor();
		}
	}
	updateMe(me) {
		this.baseUI.rightPanel.settingsUI.setMe(me);
	}
	updateMyHandState(state) {
		this.baseUI.bottomPanel.handButton.setActive(state);
	}
}

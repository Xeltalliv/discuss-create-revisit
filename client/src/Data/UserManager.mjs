import { apply } from "../Utils/TextDiff.mjs";
import BoardTxt from "./Board/BoardTxt.mjs";
import BoardImg from "./Board/BoardImg.mjs";

const BoardTypes = {
	"txt": BoardTxt,
	"img": BoardImg,
};

class User {
	constructor(data) {
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

class UserManager {
	constructor(main, baseUI) {
		this.main = main;
		this.baseUI = baseUI;
		this.users = new Map();
		this.me = null;
		main.networkManager.addHandler("users", (op, data) => {
			if (op == "addUsers") {
				for(const user of data) {
					const userObject = new User(user);
					this.users.set(user.id, userObject);
					if (user.isYou) this.me = userObject;
				}
				this.updateUserList();
			}
			if (op == "removeUsers") {
				for(const userId of data) {
					this.users.delete(userId);
				}
				this.updateUserList();
			}
			if (op == "raiseHand") {
				this.users.get(data.userId).handRaiseTime = data.time;
				this.updateUserList();
			}
			if (op == "renameUser") {
				this.users.get(data.userId).name = data.newName;
				this.updateUserList();
			}
			if (op == "setBoard") {
				this.users.get(data.userId).boards.set(data.boardId, new BoardTypes[data.board.type](data.boardId, data.userId, data.board));
				this.updateBoardsOf(data.userId);
			}
			if (op == "checkBoard") {
				baseUI.selectBoard(data.userId, data.boardId);
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
				this.updateBoardsOf(data.userId);
			}
			if (op == "deleteBoard") {
				const user = this.users.get(data.userId);
				if (!user) return;
				user.boards.delete(data.boardId);
				this.updateBoardsOf(data.userId);
			}
			if (op == "setBoardEditorId") {
				const user = this.users.get(data.userId);
				if (!user) return;
				const board = user.boards.get(data.boardId);
				if (!board) return;
				board.editorId = data.editorId;
				this.updateBoardEditor(data.userId, data.boardId);
			}
			if (op == "txtBoardApplyTransform") {
				const user = this.users.get(data.userId);
				if (!user) return;
				const board = user.boards.get(data.boardId);
				if (!board) return;
				board.data = apply(board.data, data.transform);
				this.updateBoardText(data.userId, data.boardId);
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
				this.updateBoardImage(data.userId, data.boardId);
			}
			if (op == "points") {
				const user = this.users.get(data.userId);
				if (!user) return;
				const board = user.boards.get(data.boardId);
				if (!board) return;
				board.addPoints(data.lineId, data.points);
				this.updateBoardImage(data.userId, data.boardId);
			}
		});
	}
	reset() {
		this.users.clear();
	}
	destroy() {
		this.main.networkManager.removeHandler("users");
	}
	get(id) {
		return this.users.get(id);
	}
	updateUserList() {
		this.baseUI.updateUserList(Array.from(this.users.values()));
	}
	updateBoardsOf(userId) {
		this.baseUI.updateBoardsOf(userId);
	}
	updateBoardText(userId, boardId) {
		this.baseUI.updateBoardText(userId, boardId);
	}
	updateBoardImage(userId, boardId) {
		this.baseUI.updateBoardImage(userId, boardId);
	}
	updateBoardEditor(userId, boardId) {
		this.baseUI.updateBoardEditor(userId, boardId);
	}
}

export default UserManager;
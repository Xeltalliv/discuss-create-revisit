import VideoAreaBoardBase from "./VideoAreaBoardBase.mjs";
import Line from "../../../Data/Board/Line.mjs"

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

class VideoAreaBoardImg extends VideoAreaBoardBase {
	constructor(main, baseUI, videoArea) {
		super(main, baseUI, videoArea);
		const canvas = document.createElement("canvas");
		canvas.width = CANVAS_WIDTH;
		canvas.height = CANVAS_HEIGHT;
		canvas.classList.add("baseLeftBoardCanvas");
		this.el.insertBefore(canvas, this.el.firstChild);
		this.canvas = canvas;

		const ctx = canvas.getContext("2d");
		this.ctx = ctx;
		ctx.lineCap = "round";

		const nm = main.networkManager;
		let line = null;
		let interval = null;
		let eraseSize = 0;
		const mouseMove = () => {
			const rect = canvas.getBoundingClientRect();
			const x = Math.round((event.clientX - rect.left) / rect.width * CANVAS_WIDTH);
			const y = Math.round((event.clientY - rect.top) / rect.height * CANVAS_HEIGHT);
			line.addPoint(ctx, x, y);
		};
		const mouseUp = () => {
			document.body.removeEventListener("mousemove", mouseMove);
			document.body.removeEventListener("mouseup", mouseUp);
			clearInterval(interval);
			sendPoints();
		}
		const mouseMoveErase = () => {
			const rect = canvas.getBoundingClientRect();
			const x = Math.round((event.clientX - rect.left) / rect.width * CANVAS_WIDTH);
			const y = Math.round((event.clientY - rect.top) / rect.height * CANVAS_HEIGHT);
			this.deleteLines(x, y, eraseSize);
		};
		const mouseUpErase = () => {
			document.body.removeEventListener("mousemove", mouseMoveErase);
			document.body.removeEventListener("mouseup", mouseUpErase);
		}

		const sendPoints = () => {
			const points = line.getPointsData();
			if (points.length > 0) nm.send("points", points);
		}
		const confirmLine = async (line) => {
			this.board.unconfirmedData.add(line);
			const id = await nm.sendAndWaitForReply("imgBoardNewLine", {
				userId: this.userId,
				boardId: this.boardId,
				...line.getCreationData()
			});
			this.board.unconfirmedData.delete(line);
			if (id.op == "error") return;
			line.id = id.data;
			this.board.data.set(id.data, line);
		}
		canvas.addEventListener("mousedown", (event) => {
			if (!this.editMode) return;
			event.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const x = Math.round((event.clientX - rect.left) / rect.width * CANVAS_WIDTH);
			const y = Math.round((event.clientY - rect.top) / rect.height * CANVAS_HEIGHT);
			const drawOptions = baseUI.getDrawOptions();
			if (drawOptions.mode == "draw") {
				line = new Line(drawOptions);
				line.addPoints([x, y]);
				confirmLine(line);
				interval = setInterval(sendPoints, 100);
				document.body.addEventListener("mousemove", mouseMove);
				document.body.addEventListener("mouseup", mouseUp);
			} else {
				eraseSize = drawOptions.size;
				document.body.addEventListener("mousemove", mouseMoveErase);
				document.body.addEventListener("mouseup", mouseUpErase);
			}
		});
		
		this.addButton("Edit mode", () => {
			if (baseUI.rightPanel.selectedUI == baseUI.rightPanel.drawUI) {
				this.editMode = false;
				baseUI.setRightUI("boards");
				videoArea.resetEditBoard();
			} else {
				this.editMode = true;
				baseUI.setRightUI("draw");
				videoArea.setEditBoard(this.userId, this.boardId);
			}
		});
		this.editMode = false;
	}
	onExit() {
		if (this.baseUI.rightPanel.selectedUI == this.baseUI.rightPanel.drawUI) {
			this.baseUI.setRightUI("boards");
		}
		this.editMode = false;
	}
	deleteLines(x, y, size) {
		const nm = this.main.networkManager;
		let erased = false;
		for(let [id,line] of this.board.data) {
			if (line.touches(x, y, size)) {
				this.board.data.delete(id);
				nm.send("imgBoardDeleteLine", {
					userId: this.userId,
					boardId: this.boardId,
					lineId: id
				});
				erased = true;
			}
		}
		if (erased) this.updateImage();
	}
	selectBoard(userId, boardId) {
		super.selectBoard(userId, boardId);
		this.editMode = false;
		this.updateImage();
	}
	updateImage() {
		const canvas = this.canvas;
		const ctx = this.ctx;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		const lines = Array.from(this.board.data.entries()).sort((a,b) => a[0]-b[0]);
		for(let [id,line] of lines) {
			line.draw(ctx);
		}
		for(let line of this.board.unconfirmedData) {
			line.draw(ctx);
		}
	}
}

export default VideoAreaBoardImg;
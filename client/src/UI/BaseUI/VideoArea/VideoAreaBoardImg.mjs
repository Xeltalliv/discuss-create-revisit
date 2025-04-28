import { VideoAreaBoardBase } from "./VideoAreaBoardBase.mjs";
import { Line } from "../../../Data/Boards.mjs";
import { getMainInstance } from "../../../main.mjs";

export class VideoAreaBoardImg extends VideoAreaBoardBase {
	constructor() {
		super();
		const canvas = document.createElement("canvas");
		canvas.classList.add("baseLeftBoardCanvas");
		this.el.insertBefore(canvas, this.el.firstChild);
		this.canvas = canvas;

		const ctx = canvas.getContext("2d");
		this.ctx = ctx;
		ctx.lineCap = "round";

		let line = null;
		let interval = null;
		let eraseSize = 0;
		const mouseMove = () => {
			const rect = canvas.getBoundingClientRect();
			const x = Math.round((event.clientX - rect.left) / rect.width * canvas.width);
			const y = Math.round((event.clientY - rect.top) / rect.height * canvas.height);
			line.addPoint(ctx, x, y);
		};
		const mouseUp = () => {
			document.body.removeEventListener("mousemove", mouseMove);
			document.body.removeEventListener("mouseup", mouseUp);
			clearInterval(interval);
			sendPoints();
		};
		const mouseMoveErase = () => {
			const rect = canvas.getBoundingClientRect();
			const x = Math.round((event.clientX - rect.left) / rect.width * canvas.width);
			const y = Math.round((event.clientY - rect.top) / rect.height * canvas.height);
			this.deleteLines(x, y, eraseSize);
		};
		const mouseUpErase = () => {
			document.body.removeEventListener("mousemove", mouseMoveErase);
			document.body.removeEventListener("mouseup", mouseUpErase);
		};

		const sendPoints = () => {
			const points = line.getPointsData();
			if (points.length > 0) getMainInstance().networkManager.send("points", points);
		};
		const confirmLine = async (line) => {
			this.board.unconfirmedData.add(line);
			const id = await getMainInstance().networkManager.sendAndWaitForReply("imgBoardNewLine", {
				userId: this.user.id,
				boardId: this.board.id,
				...line.getCreationData()
			});
			this.board.unconfirmedData.delete(line);
			if (id.op == "error") return;
			//line.id = id.data;
			//this.board.addLineFromWS(id, line);
			//this.board.data.set(id.data, line);
		};
		canvas.addEventListener("mousedown", (event) => {
			if (this.mode != "edit") return;
			event.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const x = Math.round((event.clientX - rect.left) / rect.width * canvas.width);
			const y = Math.round((event.clientY - rect.top) / rect.height * canvas.height);
			const drawOptions = getMainInstance().baseUI.rightPanel.drawUI.getDrawOptions();
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
		
		this.editModeButton = this.addButton("Edit mode", () => {
			const baseUI = getMainInstance().baseUI;
			if (baseUI.rightPanel.selectedUI == baseUI.rightPanel.drawUI) {
				this.setMode("view");
				baseUI.rightPanel.setUIByName("boards");
				baseUI.topMain.resetEditBoard();
			} else {
				this.setMode("edit");
				baseUI.rightPanel.setUIByName("draw");
				baseUI.topMain.setEditBoard(this.user, this.board);
			}
		});
		this.historyModeButton = this.addButton("History mode", () => {
			const baseUI = getMainInstance().baseUI;
			if (baseUI.rightPanel.selectedUI == baseUI.rightPanel.historyUI) {
				this.setMode("view");
				baseUI.rightPanel.setUIByName("boards");
				baseUI.topMain.resetEditBoard();
			} else {
				this.setMode("history");
				baseUI.rightPanel.setUIByName("history");
				baseUI.topMain.resetEditBoard();
			}
		});
		this.mode = "";
		this.setMode("view");
	}
	setMode(mode) {
		this.mode = mode;
		if (this.board) this.board.goToNow();
		this.updateImage();
		this.editModeButton.classList.toggle("baseLeftFullButtonActive", this.mode == "edit");
		this.historyModeButton.classList.toggle("baseLeftFullButtonActive", this.mode == "history");
	}
	onExit() {
		const baseUI = getMainInstance().baseUI;
		if (baseUI.rightPanel.selectedUI == baseUI.rightPanel.drawUI ||
			baseUI.rightPanel.selectedUI == baseUI.rightPanel.historyUI) {
			baseUI.rightPanel.setUIByName("boards");
		}
		this.setMode("view");
	}
	deleteLines(x, y, size) {
		const nm = getMainInstance().networkManager;
		let erased = false;
		for(let [id,line] of this.board.data) {
			if (line.touches(x, y, size)) {
				this.board.deleteLinePredicted(id);
				nm.send("imgBoardDeleteLine", {
					userId: this.user.id,
					boardId: this.board.id,
					lineId: id
				});
				erased = true;
			}
		}
		if (erased) this.updateImage();
	}
	selectBoard(user, board) {
		super.selectBoard(user, board);
		this.setMode("view");
		this.updateImage();
		getMainInstance().baseUI.rightPanel.historyUI.selectBoard(this.user, this.board);
	}
	updateImage() {
		if (this.board == null) return;
		const canvas = this.canvas;
		if (this.board.width !== canvas.width || this.board.height !== canvas.height) {
			canvas.width = this.board.width;
			canvas.height = this.board.height;
		}
		const ctx = this.ctx;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		this.board.drawBackgroundImage(ctx, this.updateImage.bind(this));
		const lines = Array.from(this.board.data.entries()).sort((a,b) => a[0]-b[0]);
		for(let [_id,line] of lines) {
			line.draw(ctx);
		}
		for(let line of this.board.unconfirmedData) {
			line.draw(ctx);
		}
	}
}

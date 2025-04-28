import { RightBasePanel } from "./RightBasePanel.mjs";
import { getMainInstance } from "../../../main.mjs";

export class RightChatPanel extends RightBasePanel {
	constructor() {
		super();
		this.setTitle("Chat");
		const input = document.createElement("input");
		input.classList.add("chatboxInput");
		input.placeholder = "Send a message";
		input.addEventListener("keyup", this.onInputKeyUp.bind(this));

		const sendButton = document.createElement("button");
		sendButton.classList.add("chatboxSend");
		sendButton.textContent = "Send";
		sendButton.addEventListener("click", this.onSend.bind(this));

		const sendFileButton = document.createElement("button");
		sendFileButton.classList.add("chatboxSend");
		sendFileButton.textContent = "Attach";
		sendFileButton.addEventListener("click", this.onAttachFile.bind(this));

		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.multiple = true;
		fileInput.addEventListener("change", async () => {
			const files = fileInput.files;
			if (files.length == 0) {
				sendFileButton.textContent = "Attach";
			} else {
				sendFileButton.textContent = `${files.length} files`;
			}
		});

		const chatbox = document.createElement("div");
		chatbox.classList.add("chatbox");
		chatbox.append(input, sendButton, sendFileButton);

		this.el.append(chatbox);
		this.input = input;
		this.fileInput = fileInput;
	}
	init() {
		getMainInstance().networkManager.addHandler("chat", (op, data) => {
			if (op == "chat") {
				const author = getMainInstance().baseUI.userManager.get(data.authorId);
				this.addContent([{
					"author": author,
					"text": data.text,
					"files": data.files
				}]);
			}
		});
	}
	onInputKeyUp(event) {
		if (event.code == "Enter") this.onSend();
	}
	async onSend() {
		const value = this.input.value;
		const files = this.fileInput.files;
		if (value.length == 0 && files.length == 0) return;
		let outFiles = null;
		if (this.fileInput.files.length > 0) {
			const formData = new FormData();
			for (const file of files) {
				formData.append("file", file); // use same field name busboy expects
			}
			try {
				const main = getMainInstance();
				const res = await fetch(`${main.httpProtocol}//${main.host}/uploads/${main.baseUI.confId}`, {
					method: "POST",
					body: formData
				});
				outFiles = await res.json();
				if (outFiles.length == 0) return;
			} catch (_err) {
				return;
			}
		}
		getMainInstance().networkManager.send("chat", {
			"text": value,
			"files": outFiles
		});
		this.input.value = "";
		this.clearFilePicker();
	}
	onAttachFile() {
		const files = this.fileInput.files;
		if (files.length == 0) {
			this.fileInput.click();
		} else {
			this.clearFilePicker();
		}
	}
	clearFilePicker() {
		this.fileInput.value = "";
		this.fileInput.dispatchEvent(new Event("change"));
	}
	getItemType() {
		return ChatMessageElement;
	}
}

class ChatMessageElement {
	constructor(data) {
		const author = document.createElement("span");
		author.textContent = data.author.name;
		author.classList.add("chatMessageAuthor");
		const br = document.createElement("br");
		const content = document.createElement("span");
		content.textContent = data.text;

		const el = document.createElement("div");
		el.classList.add("chatMessage");
		el.classList.add(data.author.isYou ? "chatMessageMy" : "chatMessageOther");
		el.append(author);
		if (data.text) el.append(br, content);

		if (data.files) {
			const main = getMainInstance();
			for (const file of data.files) {
				const br = document.createElement("br");
				const a = document.createElement("a");
				a.textContent = `${file.filename} (${formatFilesize(file.size)})`;
				a.href = `${main.httpProtocol}//${main.host}/uploads/${main.baseUI.confId}/${file.uuid}/${file.filename}`;
				a.download = file.filename;
				a.classList.add("chatMessageAttachment");
				el.append(br, a);
			}
		}
		this.el = el;
	}
}

function formatFilesize(a) {
	let letters = [" B", " KiB", " MiB", " GiB", " TiB", " PiB"];
	let i = 0;
	while(a >= 1024) {
		a /= 1024;
		i++;
	}
	if (a < 10 && i > 0) {
		a = a.toFixed(2);
	} else if (a < 100 && i > 0) {
		a = a.toFixed(1);
	} else {
		a = Math.floor(a);
	}
	return a + letters[i];
}
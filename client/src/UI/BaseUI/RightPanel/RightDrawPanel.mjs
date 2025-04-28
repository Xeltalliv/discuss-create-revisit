import { RightBasePanel } from "./RightBasePanel.mjs";

export class RightDrawPanel extends RightBasePanel {
	constructor() {
		super();
		this.setTitle("Draw options");

		const inputDrawMode = document.createElement("select");
		const inputSize = document.createElement("input");
		const inputColor = document.createElement("input");
		inputSize.type = "range";
		inputSize.min = 1;
		inputSize.max = 100;
		inputSize.step = 1;
		inputSize.value = 10;
		inputColor.type = "color";
		const optionDraw = document.createElement("option");
		const optionErase = document.createElement("option");
		optionDraw.value = "draw";
		optionErase.value = "erase";
		optionDraw.textContent = "Draw";
		optionErase.textContent = "Erase";
		inputDrawMode.append(optionDraw, optionErase);

		this.setContent([
			{
				label: "Draw mode",
				input: inputDrawMode
			}, {
				label: "Size",
				input: inputSize
			}, {
				label: "Color",
				input: inputColor
			}
		]);
		this.inputDrawMode = inputDrawMode;
		this.inputSize = inputSize;
		this.inputColor = inputColor;
	}
	getItemType() {
		return DrawOption;
	}
	getDrawOptions() {
		return {
			mode: this.inputDrawMode.value,
			size: +this.inputSize.value,
			color: this.inputColor.value
		};
	}
}

class DrawOption {
	constructor(data) {
		const label = document.createElement("div");
		label.textContent = data.label;
		const el = document.createElement("div");
		el.append(label, data.input);
		el.classList.add("drawOption");
		this.el = el;
	}
}

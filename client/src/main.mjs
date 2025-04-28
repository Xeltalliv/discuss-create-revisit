let main = null;

export function getMainInstance() {
	if (main == null) {
		throw new Error("Main instance not initialized");
	}
	return main;
}

export function setMainInstance(value) {
	main = value;
	main.init();
	window.main = main;
}
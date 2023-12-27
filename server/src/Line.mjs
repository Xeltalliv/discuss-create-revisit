class Line {
	constructor(id, data) {
		this.id = id;
		this.color = data.color;
		this.size = data.size;
		this.points = [];
	}
	getCreationData() {
		return {
			id: this.id,
			color: this.color,
			size: this.size,
		};
	}
	addPoints(points) {
		this.points.push(...points);
	}
}

export default Line;
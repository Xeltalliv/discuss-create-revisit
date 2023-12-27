import { pointToLineDistance } from "../../Utils/LineDistance.mjs";

class Line {
	constructor(data={}) {
		this.id = data.id ?? 0;
		this.color = data.color ?? "#000000";
		this.size = data.size ?? 10;
		this.points = data.points ?? [];
		this.pointsSent = 0;
	}
	draw(ctx) {
		const points = this.points;
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.size;
		ctx.beginPath();
		ctx.moveTo(points[0], points[1]);
		for(let i=2; i<points.length; i+=2) {
			ctx.lineTo(points[i], points[i+1]);
		}
		ctx.stroke();
	}
	addPoint(ctx, x, y) {
		const l = this.points.length;
		this.points.push(x, y);
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.size;
		ctx.beginPath();
		ctx.moveTo(this.points[l-2], this.points[l-1]);
		ctx.lineTo(x, y);
		ctx.stroke();
	}
	getCreationData() {
		return {
			color: this.color,
			size: this.size,
		}
	}
	getPointsData() {
		const pointData = this.points.slice(this.pointsSent);
		this.pointsSent = this.points.length;
		return pointData;
	}
	addPoints(points) {
		this.points.push(...points);
	}
	touches(x, y, size) {
		const points = this.points;
		const touchDistance = (size + this.size) / 2;
		for(let i=3; i<points.length; i+=2) {
			const distance = pointToLineDistance(x, y, points[i-3], points[i-2], points[i-1], points[i]);
			if (distance < touchDistance) return true;
		}
		return false;
	}
}

export default Line;
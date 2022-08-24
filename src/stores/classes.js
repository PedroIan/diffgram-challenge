export const scale = window.devicePixelRatio;

const CIRCLESIZE = 2.3;
// 3.5
const radius = CIRCLESIZE * scale;

const LINEWIDTH = 1;

export class Point {
	constructor(x = null, y = null) {
		this.x = x;
		this.y = y;
	}

	exists() {
		if (this.x && this.y) return true;
		else return false;
	}
}

export function getMousePos(event, canvas) {
	var rect = canvas.getBoundingClientRect(); // abs. size of element
	// scaleX = canvas.width / rect.width, // relationship bitmap vs. element for x
	// scaleY = canvas.height / rect.height; // relationship bitmap vs. element for y
	const x = event.clientX - rect.left; // scale mouse coordinates after they have
	const y = event.clientY - rect.top; // been adjusted to be relative to element
	return new Point(x, y);
}

function toInt(n) {
	return parseInt(n, 10);
}

function getMinMaxBox(point1, point2) {
	let min;
	let max;

	let minorY;
	if (point1.y < point2.y) {
		minorY = 1;
	} else if (point2.y < point1.y) {
		minorY = 2;
	} else {
		console.error('The two points of a rectangle cannot have the same Y.');
		return;
	}

	let minorX;
	if (point1.x < point2.x) {
		minorX = 1;
	} else if (point2.x < point1.x) {
		minorX = 2;
	} else {
		console.error('The two points of a rectangle cannot have the same X.');
		return;
	}

	if (minorY == 1 && minorX == 1) {
		min = point2;
		max = point1;
	} else if (minorY == 2 && minorX == 2) {
		min = point1;
		max = point2;
	} else if (minorY == 1 && minorX == 2) {
		min = new Point(point1.x, point2.y);
		max = new Point(point2.x, point1.y);
	} else if (minorY == 2 && minorX == 1) {
		min = new Point(point2.x, point1.y);
		max = new Point(point1.x, point2.y);
	}

	return {
		min: min,
		max: max,
	};
}

function getDistance(point1, point2) {
	const distance = Math.floor(
		Math.sqrt(
			Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
		)
	);

	return distance;
}

//return 0 if is not in box, 1 if is on max point, 2 if is only on square, 3 if is on min point
export function isInBox(pos, point) {
	function isInCircle(center, point) {
		const distance = getDistance(center, point);
		return distance <= radius;
	}

	if (!pos?.min?.exists()) {
		console.error(`Min point doesn't exist.`);
		return;
	}
	if (!pos?.max?.exists()) {
		console.error(`Max point doesn't exist.`);
		return;
	}
	if (!point?.exists()) {
		console.error(`Searched point doesn't exist.`);
		return;
	}

	const isInMin = isInCircle(pos.min, point);
	const isInMax = isInCircle(pos.max, point);

	if (isInMax) return 1;
	else if (isInMin) return 3;
	else if (
		pos.min.x > point.x &&
		pos.min.y > point.y &&
		pos.max.x < point.x &&
		pos.max.y < point.y
	)
		return 2;
	else return 0;
}

//return {index: -1, type: if any box is selected
export function getBoxSelected(boxList, event, canvas) {
	const mousePosition = getMousePos(event, canvas);

	const responses = boxList
		.map((box) => isInBox(box.pos, mousePosition))
		.filter((res) => res >= 0);

	// if mouse is over any min and max point it will be selected instead of any box that the mouse is only above the rectangle
	let lastIndexMax = responses.lastIndexOf(1);
	let lastIndexMin = responses.lastIndexOf(3);

	let lastIndexInside = -1;
	let index = -1;

	if (lastIndexMax == -1 && lastIndexMin == -1)
		lastIndexInside = responses.lastIndexOf(2);

	if (lastIndexMax > lastIndexMin && lastIndexMax > lastIndexInside) {
		index = lastIndexMax;
	} else if (lastIndexMin > lastIndexMax && lastIndexMin > lastIndexInside) {
		index = lastIndexMin;
	} else if (
		lastIndexInside > lastIndexMax &&
		lastIndexInside > lastIndexMin
	) {
		index = lastIndexInside;
	}

	// resolve type equal zero if point is not in the box
	return { index, type: index > -1 ? responses[index] : 0 };
}

export class RectangleCoord {
	constructor(p1 = new Point(), p2 = new Point()) {
		if (p1 != null && p2 != null) {
			const answer = getMinMaxBox(p1, p2);
			if (!!answer) {
				this.min = new Point(answer.min.x, answer.min.y);
				this.max = new Point(answer.max.x, answer.max.y);
			}
		} else {
			this.min = null;
			this.max = null;
		}
	}
}

export class Colour {
	constructor(rgba = { r: 116, g: 251, b: 200, a: 0.3 }, hex = '#74fbc84d') {
		this.rgba = rgba;
		this.hex = hex;
	}

	getRgba() {
		const rgba = this.rgba;
		return `rgba(${rgba.r},${rgba.g},${rgba.b}, ${rgba.a})`;
	}
}

//default colors
const translucidGreen = new Colour();
const selectedBlue = new Colour({ r: 0, g: 40, b: 255, a: 0.1 }, '#0028ff4d');
const black = new Colour({ r: 0, g: 0, b: 0, a: 0.45 }, '#00000099');
const strokeBlue = new Colour({ r: 0, g: 40, b: 255, a: 0.4 }, '#0028ffb3');
const strongBlack = new Colour({ r: 0, g: 0, b: 0, a: 1 }, '#74fbb3');

export class BoxLabel {
	constructor(name = 'default', is_visible = true, colour = strongBlack) {
		this.name = name;
		this.is_visible = is_visible;
		this.colour = colour;
	}

	exists() {
		return this.name?.length && this.is_visible != undefined;
	}

	draw(ctx, pos) {
		ctx.fillStyle = this.colour.getRgba();
		ctx.fillText(this.name, toInt(pos.x), toInt(pos.y));
	}
}

export class Circle {
	constructor(
		center = new Point(),
		colors = {
			stroke: black,
			fill: translucidGreen,
		}
	) {
		this.center = center;
		this.radius = CIRCLESIZE * scale;
		this.colors = colors;
	}

	draw(ctx) {
		ctx.moveTo(this.center.x, this.center.y);

		ctx.beginPath();
		ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
		ctx.closePath();

		ctx.fillStyle = this.colors.fill.getRgba();
		ctx.fill();

		ctx.lineWidth = LINEWIDTH;
		// ctx.strokeStyle = this.colors.stroke.getRgba();
		// ctx.stroke();
	}

	exists() {
		return (
			this.pos.min.x && this.pos.min.y && this.pos.max.x && this.pos.max.y
		);
	}
}

export class Box {
	constructor(
		soft_delete = false,
		selected = false,
		special_condition = false,
		pos = new RectangleCoord(),
		label = new BoxLabel(),
		colors = {
			stroke: black,
			fill: translucidGreen,
		}
	) {
		this.soft_delete = soft_delete;
		this.selected = selected;
		this.special_condition = special_condition;
		this.pos = pos;
		this.label = label;
		this.colors = colors;
	}

	get width() {
		return this.pos.max.x - this.pos.min.x;
	}

	get height() {
		return this.pos.min.y - this.pos.max.y;
	}

	validate() {
		return this.pos?.min?.exists() && this.pos?.max?.exists();
	}

	draw(ctx, selected) {
		if (this.validate()) {
			const boxMinX = this.pos.min.x;
			const boxMaxY = this.pos.max.y;
			const width = this.pos.max.x - this.pos.min.x;
			const height = this.pos.min.y - this.pos.max.y;

			if (selected) {
				ctx.fillStyle = selectedBlue.getRgba();
				ctx.strokeStyle = strokeBlue.getRgba();
			} else {
				ctx.fillStyle = this.colors.fill.getRgba();
				ctx.strokeStyle = this.colors.stroke.getRgba();
			}

			if (this.special_condition) {
				ctx.setLineDash([5, 15]);
			} else {
				ctx.setLineDash([]);
			}

			ctx.lineWidth = LINEWIDTH;
			ctx.fillRect(boxMinX, boxMaxY, width, height);
			ctx.strokeRect(boxMinX, boxMaxY, width, height);
		} else {
			console.error("it doesn't work");
		}
	}

	setMin(point) {
		if (point != this.pos.max) this.pos.min = point;
	}

	setMax(point) {
		if (point != this.pos.min) this.pos.max = point;
	}

	getMinMaxBox(point1, point2) {
		return getMinMaxBox(point1, point2);
	}
}

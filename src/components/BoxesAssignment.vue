<template>
	<div id="screen" class="screen">
		<img
			class="image"
			style="width: 500px; heigth: 500px"
			src="./../assets/benjamin_franklin.jpg"
		/>
		<canvas
			id="c"
			class="canvas"
			v-on:mousedown="startPainting"
			v-on:mouseup="finishedPainting"
			v-on:mousemove="draw"
		></canvas>
	</div>

	<!-- onkeydown -->
</template>

<style scoped>
.screen {
	width: 100%;
	height: 100%;
}

.canvas {
	position: relative;
	width: inherit;
	height: inherit;
	z-index: 1;
	bottom: 505px;
}

.image {
	width: 500px;
	height: 500px;
	position: relative;
}
</style>

<script>
import {
	Point,
	RectangleCoord,
	Colour,
	BoxLabel,
	Circle,
	Box,
	scale,
	getBoxSelected,
	getMousePos,
} from '../stores/classes.js';

let box_list = [
	new Box(
		false,
		false,
		true,
		new RectangleCoord(new Point(110, 490), new Point(400, 15)),
		new BoxLabel(
			'franklin',
			true,
			new Colour({ r: 116, g: 251, b: 179, a: 1 }, '#74fbb3')
		)
	),
	new Box(
		false,
		false,
		false,
		new RectangleCoord(new Point(308, 84), new Point(238, 120)),
		new BoxLabel(
			'glasses',
			true,
			new Colour({ r: 0, g: 0, b: 0, a: 1 }, '#74fbb3')
		)
	),
];

export default {
	// props: [
	//   "ord",
	//   "box_list",
	//   "current_box",
	//   "refresh",
	//   "mouse_position",
	//   "draw_mode",
	//   "canvas_transform",
	//   "show_annotations",
	// ],
	data() {
		return {
			canvas: null,
			vueCanvas: null,

			ord: null,
			boxlist: box_list,
			current_box: null,
			clicked_box: null,
			refresh: null,
			mouse_position: new Point(),
			draw_mode: false,
			canvas_transform: {
				scale: scale,
			},
			show_annotations: true,
			size: 500 * scale,
			firstPoint: null,
			newBox: false,
		};
	},
	mounted() {
		this.canvas = document.getElementById('c');
		var ctx = c.getContext('2d');

		var size = 500;
		this.canvas.style.width = size + 'px';
		this.canvas.style.height = size + 'px';

		this.canvas.width = Math.floor(size * scale);
		this.canvas.height = Math.floor(size * scale);

		//CSS pixels for coordinate systems
		ctx.scale(scale, scale);
		ctx.font = '10px Verdana';
		ctx.textAlign = 'start';
		this.vueCanvas = ctx;

		this.redrawCanvas();
	},
	// /* ord, order of drawing on canvas
	// * box_list, list of dictionaries,
	// * current_box, dictionary,
	// * refresh, integer / hack for forcing reactive property change
	// * mouse_position, dictionary, x, y
	// * draw_mode, boolean
	// * canvas_transform, dictionary,
	// * show_annotations, boolean
	// * */
	methods: {
		startPainting: function (event) {
			this.draw_mode = true;
			this.clicked_box = getBoxSelected(this.boxlist, event, this.canvas);
			if ([0, 2].includes(this.clicked_box.type)) {
				this.firstPoint = getMousePos(event, this.canvas);
				const lastPoint = new Point(
					this.firstPoint.x + 1,
					this.firstPoint.y + 1
				);
				const auxBox = new Box(
					false,
					false,
					false,
					new RectangleCoord(lastPoint, this.firstPoint),
					new BoxLabel(`default_${(this.boxlist?.length ?? 0) + 1}`)
				);
				if (auxBox && auxBox.pos.min) {
					this.boxlist.push(auxBox);
					this.currentBox = this.boxlist[-1];
					this.clicked_box = {
						index: this.boxlist.length - 1,
						type: 1,
					};
				}
			}
		},
		finishedPainting: function () {
			this.draw_mode = false;
			const current_box_index = this.current_box?.index;

			if (current_box_index >= 0) {
				const auxBox = this.boxlist[current_box_index];

				if (auxBox && auxBox.pos.min)
					this.boxlist[current_box_index].pos = new RectangleCoord(
						auxBox.pos.min,
						auxBox.pos.max
					);
			}
			this.clicked_box = null;
			this.firstPoint = null;
			this.redrawCanvas();
		},
		draw: function (event) {
			// {index: ${indexOfBoxSelected}, type: {typeOfSelection}}
			// typeOfSelection:
			//     0 none
			//     1 max point
			//     2 inside rectangle
			//     3 min point
			this.current_box =
				this.clicked_box ??
				getBoxSelected(this.boxlist, event, this.canvas);
			const mouse_pos = getMousePos(event, this.canvas);

			if (this.draw_mode) {
				// moving max point
				if (this.current_box?.type == 1) {
					this.boxlist[this.current_box.index].setMax(mouse_pos);
				}
				// moving min point
				if (this.current_box?.type == 3) {
					this.boxlist[this.current_box.index].setMin(mouse_pos);
				}
			}
			if (this.current_box || this.firstPoint) this.redrawCanvas();
		},
		redrawCanvas: function () {
			let boxes = this.boxlist;

			this.vueCanvas.clearRect(0, 0, this.size, this.size);
			for (var i in boxes) {
				let box = boxes[i];

				if (box.soft_delete != true) {
					if (box.label.is_visible == true) {
						let selected = false;

						if (this.current_box?.index == i) {
							selected = true;
						}

						box.draw(this.vueCanvas, selected);

						// draw label
						if (this.show_annotations)
							if (box.label.exists())
								box.label.draw(this.vueCanvas, box.pos.max);

						const { x: xMin, y: yMin } = box.pos.min;
						const { x: xMax, y: yMax } = box.pos.max;

						new Circle(new Point(xMin, yMin)).draw(
							this.vueCanvas,
							this.canvas_transform.scale
						);

						new Circle(new Point(xMax, yMax)).draw(
							this.vueCanvas,
							this.canvas_transform.scale
						);
					}
				}
			}
		},
	},
};
</script>


(function () {

	var maxHeight = 550;

	function mergeObjects(obj1, obj2) {
		var obj3 = {};
		var attrname;
		for (attrname in (obj1 || {})) {
			if (obj1.hasOwnProperty(attrname)) {
				obj3[attrname] = obj1[attrname];
			}
		}
		for (attrname in (obj2 || {})) {
			if (obj2.hasOwnProperty(attrname)) {
				obj3[attrname] = obj2[attrname];
			}
		}
		return obj3;
	}


	function Sketchpad(el, opts, tools) {
		var that = this;

		if (!el) {
			throw new Error('Must pass in a container element');
		}

		tools = tools || {};
		// tools.undo = tools.undo || false;
		// tools.redo = tools.redo || false;
		// tools.play = tools.play || false;
		// tools.playAll = tools.playAll || false;

		opts = opts || {};

		//console.log(el.clientWidth);
		if(el.clientWidth === 0)
		{
			//console.log(el);
		}
		opts.aspectRatio = opts.aspectRatio || 1;
		opts.width = opts.width || el.clientWidth-20;
		//var height = ((opts.width * opts.aspectRatio) < maxHeight ? opts.width * opts.aspectRatio : maxHeight);
		opts.height = opts.height || opts.width/opts.aspectRatio;
		opts.data = opts.data || [];
		opts.color = opts.color || '#000';
		opts.line = mergeObjects({
			color: opts.color,
			size: 5,
			cap: 'round',
			join: 'round',
			miterLimit: 10
		}, opts.line);

		var strokes = opts.data;
		var undos = [];

		// Boolean indicating if currently drawing
		var sketching = false;

		// Create a canvas element
		var canvas = document.createElement('canvas');

		/**
		 * Set the size of canvas
		 */
		function setCanvasSize (width, height) {
			canvas.setAttribute('width', width);
			canvas.setAttribute('height', height);
			canvas.style.width = width + 'px';
			canvas.style.height = height + 'px';
			canvas.style.padding = '0';
			canvas.style.margin = '0 auto';
			canvas.style.display = 'block';
			canvas.style.border = '1px solid #ACB1B0';
			if(opts.drawing)
			{
				if(opts.color && opts.color === 'red') {
					canvas.style.cursor = 'url("http://ani.cursors-4u.net/others/images9/oth845.png"),url("http://ani.cursors-4u.net/others/oth-9/oth845.cur"),auto';
				} else {
					canvas.style.cursor = 'url("http://ani.cursors-4u.net/others/images9/oth838.png"),url("http://ani.cursors-4u.net/others/oth-9/oth838.cur"),auto';
				}
			}
		}
		

		function undo() {
			that.undo();
			for(var i=0;i<document.getElementsByClassName('play').length;i++){
				document.getElementsByClassName('play')[i].disabled = false;
			}
		}

		function redo() {
			that.redo();
			for(var i=0;i<document.getElementsByClassName('play').length;i++){
				document.getElementsByClassName('play')[i].disabled = false;
			}
		}

		function play() {
			that.play();
		}

		function playAll() {
			that.playAll();
		}

		function share() {
			that.share();
		}

		function addToolbar (buttonsForTools) {
			var toolbar = document.createElement('div');
			toolbar.style.width = '100%';
			toolbar.style.textAlign = 'center';
			toolbar.style.marginBottom = '10px';
			if (buttonsForTools.play) toolbar.appendChild(addButton('play'));
			if (buttonsForTools.playAll) toolbar.appendChild(addButton('playAll'));
			if (buttonsForTools.undo) toolbar.appendChild(addButton('undo'));
			if (buttonsForTools.redo) toolbar.appendChild(addButton('redo'));
			if (buttonsForTools.share) toolbar.appendChild(addButton('share'));
			if(buttonsForTools.undo || buttonsForTools.redo || buttonsForTools.play || buttonsForTools.playAll) {
				el.appendChild(toolbar);
			}
		}

		/**
			* Set button events
			*/
		function addButton (event) {

			var button = document.createElement('button');

			button.onclick = function() {
				switch(event) {
					case 'undo':
						undo();
						break;
					case 'redo':
						redo();
						break;
					case 'play':
						play();
						break;
					case 'playAll':
						playAll();
						break;
					case 'share':
						share();
						break;
				}
			}
			button.setAttribute('id', event);
			button.setAttribute('class', 'btn btn-primary');
			button.style.margin = '5px';
			button.style.padding = '5px 10px';
			button.style.fontSize = '16px';
			if(event === 'undo') {
				button.innerHTML = '<i class="fa fa-undo"></i> Undo';
			}
			else if(event === 'redo') {
				button.innerHTML = '<i class="fa fa-repeat"></i> Redo';
			}
			else if(event === 'playAll') {
				button.innerHTML = '<i class="fa fa-play"></i> Abspielen';
				button.setAttribute('class', 'btn btn-primary play');
			}
			else if(event === 'share') {
				button.innerHTML = '<i class="fa fa-share-alt"></i> Freigeben';
			}
			else
			{
				button.innerHTML = event;
			}

			return button;
		}

		/**
		 * Get the size of the canvas
		 */
		function getCanvasSize () {
			return {
				width: canvas.width,
				height: canvas.height
			};
		}

		addToolbar(tools);
		setCanvasSize(opts.width, opts.height);
		el.appendChild(canvas);
		var context = canvas.getContext('2d');

		/**
		 * Returns a points x,y locations relative to the size of the canvase
		 */
		function getPointRelativeToCanvas (point) {
			var canvasSize = getCanvasSize();
			return {
				x: point.x / canvasSize.width,
				y: point.y / canvasSize.height
			};
		}

		/**
		 * Returns true if is a touch event, false otherwise
		 */
		function isTouchEvent (e) {
			return e.type.indexOf('touch') !== -1;
		}

		/**
		 * Get location of the cursor in the canvas
		 */
		function getCursorRelativeToCanvas (e) {
			var cur = {};

			if (isTouchEvent(e)) {
				cur.x = e.touches[0].pageX - canvas.offsetLeft;
				cur.y = e.touches[0].pageY - canvas.offsetTop;
			} else {
				var rect = that.canvas.getBoundingClientRect();
				cur.x = e.clientX - rect.left;
				cur.y = e.clientY - rect.top;
			}

			return getPointRelativeToCanvas(cur);
		}

		/**
		 * Get the line size relative to the size of the canvas
		 * @return {[type]} [description]
		 */
		function getLineSizeRelativeToCanvas (size) {
			var canvasSize = getCanvasSize();
			return size / canvasSize.width;
		}

		/**
		 * Erase everything in the canvase
		 */
		function clearCanvas () {
			var canvasSize = getCanvasSize();
			context.clearRect(0, 0, canvasSize.width, canvasSize.height);
		}

		/**
		 * Since points are stored relative to the size of the canvas
		 * this takes a point and converts it to actual x, y distances in the canvas
		 */
		function normalizePoint (point) {
			var canvasSize = getCanvasSize();
			return {
				x: point.x * canvasSize.width,
				y: point.y * canvasSize.height
			};
		}

		/**
		 * Since line sizes are stored relative to the size of the canvas
		 * this takes a line size and converts it to a line size
		 * appropriate to the size of the canvas
		 */
		function normalizeLineSize (size) {
			var canvasSize = getCanvasSize();
			return size * canvasSize.width;
		}

		/**
		 * Draw a stroke on the canvas
		 */
		function drawStroke (stroke) {
			context.beginPath();
			for (var j = 0; j < stroke.points.length - 1; j++) {
				var start = normalizePoint(stroke.points[j]);
				var end = normalizePoint(stroke.points[j + 1]);

				context.moveTo(start.x, start.y);
				context.lineTo(end.x, end.y);
			}
			context.closePath();

			context.strokeStyle = stroke.color;
			context.lineWidth = normalizeLineSize(stroke.size);
			context.lineJoin = stroke.join;
			context.lineCap = stroke.cap;
			context.miterLimit = stroke.miterLimit;

			context.stroke();
		}

		var pointsCounter = 0;
		var onlyOnes = false;
		var currentCounter = 0;

		/**
		 * Draw a stroke on the canvas
		 */
		function drawPointsInDetail (points, strokes) {
		
			var n = points.length - 1;	// 4 - 2,2
			var j=0;

			var refreshIntervalId = setInterval(function() {

				if (j < n)
				{
					if(replay) 
					{
						var t=0;
						for(var s=0; s<strokes.length; s++)
						{
							// get current stroke
							var stroke = strokes[s];
							t += stroke.points.length;

							if(j < t)
							{
								if(j+1 !== t)
								{
									context.beginPath();

									var start = normalizePoint(points[j]);
									var end = normalizePoint(points[j + 1]);

									context.moveTo(start.x, start.y);
									context.lineTo(end.x, end.y);

									context.closePath();
									context.strokeStyle = stroke.color;
									// 90% as a workaround for beginPath/endPath multiple
									context.lineWidth = normalizeLineSize(stroke.size * 90/100);
									context.lineJoin = stroke.join;
									context.lineCap = stroke.cap;
									context.miterLimit = stroke.miterLimit;

									context.stroke();
								}

								break;
							}					
						}
						j++;
					}
					else {
						console.log("test");
						// last known position
						while(refreshIntervalId)
						if(!onlyOnes)
						{
							onlyOnes = true;
							pointsCounter = j;
							console.log("again new pointsCounter"+pointsCounter);
							stopDrawing(pointsCounter);
							clearInterval(refreshIntervalId);
						}
						j=n;
						//redraw();
					}
				}
				else {
					// all iterated
					//pointsCounter += n;
					// if(!onlyOnes)
					// {
					// 	onlyOnes = true;
					// 	for(var i=0;i<document.getElementsByClassName('play').length;i++){
					// 		document.getElementsByClassName('play')[i].disabled = false;
					// 	}
					// }

					pointsCounter += 1;
					if(pointsCounter === strokes.length) {
						for(var i=0;i<document.getElementsByClassName('play').length;i++){
							document.getElementsByClassName('play')[i].disabled = false;
						}
					}
					console.log("new pointsCounter"+pointsCounter);
					clearInterval(refreshIntervalId);
					currentCounter = 0;
				}
			}, 20);
		}


		function stopDrawing(pointsCount) {

			var n = pointsCount;
			var j=0;

			if (j < n)
			{
				var t=0;
				for(var s=0; s<strokes.length; s++)
				{
					// get current stroke
					var stroke = that.strokes[s];
					t += stroke.points.length;

					if(j < t)
					{
						if(j+1 !== t)
						{
							context.beginPath();

							var start = normalizePoint(points[j]);
							var end = normalizePoint(points[j + 1]);

							context.moveTo(start.x, start.y);
							context.lineTo(end.x, end.y);

							context.closePath();
							context.strokeStyle = stroke.color;
							// 90% as a workaround for beginPath/endPath multiple
							context.lineWidth = normalizeLineSize(stroke.size * 90/100);
							context.lineJoin = stroke.join;
							context.lineCap = stroke.cap;
							context.miterLimit = stroke.miterLimit;

							context.stroke();
						}

						break;
					}					
				}
				j++;
			}

			// for(var i=0; i<that.strokes.length; i++) {
			// 	console.log("step "+i);
			// 	if(counter < pointsCount) {
			// 		counter += that.strokes[i].points.length;
			// 		console.log("new Counter: "+pointsCount);
			// 		if(counter > pointsCount) {
			// 			that.strokes[i].points = that.strokes[i].points.slice(0,(pointsCount - (counter - that.strokes[i].points.length)));
			// 		}
			// 	}
			// 	else {
			// 		that.strokes[i].points = [];
			// 	}
			// }
			redraw();
		}


		/**
		 * Redraw the canvas
		 */
		function redraw () {
			clearCanvas();

			for (var i = 0; i < that.strokes.length; i++) {
				drawStroke(that.strokes[i]);
			}
		}

		/**
		 * Redraw the canvas
		 */
		function redraw_detail () {
			clearCanvas();

			var points = []; 
			for (var i = 0; i < that.strokes.length; i++) {
				points = points.concat(that.strokes[i].points);
			}

			drawPointsInDetail(points, that.strokes);
		}

		// On mouse down, create a new stroke with a start location
		function startLine (e) {
			e.preventDefault();

			strokes = that.strokes;
			sketching = true;
			that.undos = [];

			var cursor = getCursorRelativeToCanvas(e);
			strokes.push({
				points: [cursor],
				color: opts.line.color,
				size: getLineSizeRelativeToCanvas(opts.line.size),
				cap: opts.line.cap,
				join: opts.line.join,
				miterLimit: opts.line.miterLimit
			});
		}

		function drawLine (e) {
			if (!sketching) {
				return;
			}

			e.preventDefault();

			var cursor = getCursorRelativeToCanvas(e);
			that.strokes[strokes.length - 1].points.push({
				x: cursor.x,
				y: cursor.y
			});

			that.redraw();
		}

		function endLine (e) {
			if (!sketching) {
				return;
			}

			e.preventDefault();

			sketching = false;

			if (isTouchEvent(e)) {
				return;  // touchend events do not have a cursor position
			}

			var cursor = getCursorRelativeToCanvas(e);
			that.strokes[strokes.length - 1].points.push({
				x: cursor.x,
				y: cursor.y
			});
			that.redraw();
		}

		if(opts.drawing)
		{
			// Event Listeners
			canvas.addEventListener('mousedown', startLine);
			canvas.addEventListener('touchstart', startLine);

			canvas.addEventListener('mousemove', drawLine);
			canvas.addEventListener('touchmove', drawLine);

			canvas.addEventListener('mouseup', endLine);
			canvas.addEventListener('mouseleave', endLine);
			canvas.addEventListener('touchend', endLine);
		}

		// Public variables
		this.canvas = canvas;
		this.strokes = strokes;
		this.undos = undos;
		this.opts = opts;

		// Public functions
		this.redraw = redraw;
		this.redraw_detail = redraw_detail;
		this.setCanvasSize = setCanvasSize;
		this.getPointRelativeToCanvas = getPointRelativeToCanvas;
		this.getLineSizeRelativeToCanvas = getLineSizeRelativeToCanvas;
	}


	/**
	 * Undo the last action
	 */
	Sketchpad.prototype.undo = function () {
		if (this.strokes.length === 0){
			return;
		}

		this.undos.push(this.strokes.pop());
		this.redraw();
	};


	/**
	 * Play for showing the draw process
	 */
	Sketchpad.prototype.play = function () {

		while(this.strokes.length > 0)
		{
			this.undos.push(this.strokes.pop());
		}

		var that = this;

		var n = that.undos.length;
		var i = 0;
		that.redo();

		setInterval(function() {
			if (i <= n)
			{
				that.redo();
				i++;
			} 
		}, 300);
	};

	var replay = false;

	Sketchpad.prototype.share = function () {
		$('#resultChart').modal('hide');
		$('#successShare').show('slow');
		setTimeout(hideSuccess, 10000);
	};

	function hideSuccess(){
		$('#successShare').hide('slow');
	}

	/**
	 * Play all points for showing the draw process
	 */
	Sketchpad.prototype.playAll = function () {

		// if(replay) {
		// 	replay = false;
			//el.getElementById("playAll").innerHTML = "Angehalten";
		// }
		// else {
		replay = true;
		for(var i=0;i<document.getElementsByClassName('play').length;i++){
			document.getElementsByClassName('play')[i].disabled = true;
		}
		//el.getElementById("playAll").innerHTML = "Stop";
		// }

		if(replay) {
			while(this.strokes.length > 0)
			{
				this.undos.push(this.strokes.pop());
			}

			var that = this;

			var n = that.undos.length;
			var i = 0;
			that.redo_all();

			while (i <= n )
			{
				that.redo_all();
				i++;
			}
		}
	};


	/**
	 * Redo the last undo action
	 */
	Sketchpad.prototype.redo = function () {
		if (this.undos.length === 0) {
			return;
		}

		this.strokes.push(this.undos.pop());
		this.redraw();
	};

		/**
	 * Redo the last undo action
	 */
	Sketchpad.prototype.redo_all = function () {
		if (this.undos.length === 0) {
			return;
		}

		this.strokes.push(this.undos.pop());
		this.redraw_detail();
	};


	/**
	 * Clear the sketchpad
	 */
	Sketchpad.prototype.clear = function () {
		if (this.strokes.length === 0){
			return;
		}

		while(this.strokes.length > 0)
		{
			this.undos.push(this.strokes.pop());
		}	
		//this.undos = [];  // TODO: Add clear action to undo
		//this.strokes = [];
		this.redraw();
	};


	/**
	 * Convert the sketchpad to a JSON object that can be loaded into
	 * other sketchpads or stored on a server
	 */
	Sketchpad.prototype.toJSON = function () {
		//var canvasSize = this.getCanvasSize();
		return {
			version: 1,
			aspectRatio: this.canvas.width / this.canvas.height,
			strokes: this.strokes
		};
	};


	/**
	 * Load a json object into the sketchpad
	 * @return {object} - JSON object to load
	 */
	Sketchpad.prototype.loadJSON = function (data) {
		data = JSON.parse(data);
		this.strokes = data.strokes;
		this.redraw();
	};


	/**
	 * Get a static image element of the canvas
	 */
	Sketchpad.prototype.getImage = function () {
		return '<img src="' + this.canvas.toDataURL('image/png') + '"/>';
	};


	/**
	 * Set the line size
	 * @param {number} size - Size of the brush
	 */
	Sketchpad.prototype.setLineSize = function (size) {
		this.opts.line.size = size;
	};


	/**
	 * Set the line color
	 * @param {string} color - Hexadecimal color code
	 */
	Sketchpad.prototype.setLineColor = function (color) {
		this.opts.line.color = color;
	};


	/**
	 * Draw a line
	 * @param  {object} start    - Starting x and y locations
	 * @param  {object} end      - Ending x and y locations
	 * @param  {object} lineOpts - Options for line (color, size, etc.)
	 */
	Sketchpad.prototype.drawLine = function (start, end, lineOpts) {
		lineOpts = mergeObjects(this.opts.line, lineOpts);
		start = this.getPointRelativeToCanvas(start);
		end = this.getPointRelativeToCanvas(end);

		this.strokes.push({
			points: [start, end],
			color: lineOpts.color,
			size: this.getLineSizeRelativeToCanvas(lineOpts.size),
			cap: lineOpts.cap,
			join: lineOpts.join,
			miterLimit: lineOpts.miterLimit
		});
		this.redraw();
	};


	/**
	 * Resize the canvas maintaining original aspect ratio
	 * @param  {number} width - New width of the canvas
	 */
	Sketchpad.prototype.resize = function (width) {
		//var height = ((width * this.opts.aspectRatio) < maxHeight ? width * this.opts.aspectRatio : maxHeight);
		var height = width * this.opts.aspectRatio;
		this.opts.lineSize = this.opts.lineSize * (width / this.opts.width);
		this.opts.width = width;
		this.opts.height = height;

		this.setCanvasSize(width, height);
		this.redraw();
	};


	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = Sketchpad;
	} else {
		window.Sketchpad = Sketchpad;
	}
})();

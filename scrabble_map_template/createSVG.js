(() => {
	function round(n) {
		// inkscape rounds to 3dp, lets do the same here
		return Math.round(n * 1000 + Number.EPSILON) / 1000;
	}

	function toCammelCase(str) {
		// this isn't perfect implementation but it's good enough for this

		return str.toLowerCase().replace(/ ([a-z])/, (match, p1) => {
			return p1.toUpperCase();
		});
	}

	function toStyleString(style) {
		let styleStr = '';

		for (let key in style) {
			styleStr += key + ':' + style[key] + ';';
		}

		styleStr = styleStr.replace(/;$/, '');

		return styleStr;
	}

	const NODE_SIZE = 0.5; // effects x and y being wrong in comparison to actual svg

	// for measuring text and aligning letters
	const Canvas = {
		el: null,
		ctx: null,
		create: function() {
			this.el = document.createElement('canvas');
			this.el.style.display = 'none';
			document.body.appendChild(this.el);
			this.ctx = this.el.getContext('2d');
		}
	};

	function createCanvas() {
		if (document.readyState != 'complete') {
			return setTimeout(createCanvas, 500);
		}

		Canvas.create();
	}

	const Text = {
		currentId: 0,
		create: function(value = '') {
			const that = this;

			return {
				value: value,
				x: 0,
				y: 0,
				style: {
					'font-style': 'normal',
					'font-variant': 'normal',
					'font-weight': 'normal',
					'font-stretch': 'normal',
					'font-size': '50pt',// can use px
					'line-height': '1em',
					'font-family': 'Berlin Sans FB Demi',
					'text-align': 'start',
					'letter-spacing': '0px',
					'word-spacing': '0px',
					'writing-mode': 'lr-tb',
					'text-anchor': 'start',
					fill: '#000000',
					'fill-opacity': 1,
					stroke: 'none'
				},
				font: function() {
					// https://developer.mozilla.org/en-US/docs/Web/CSS/font
					let fontStr = '';

					const optional = ['font-style', 'font-variant', 'font-weight', 'font-stretch'];
					for (let prop of optional) {
						const value = this.style[prop];

						if (value && value != 'none') {
							fontStr += value + ' ';
						}
					}

					fontStr += this.style['font-size'] + '/' + this.style['line-height'] + ' ' + this.style['font-family'];

					return fontStr;
				},
				measure: function() {
					// https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript#answer-21015393
					// https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas#answer-45789011

					Canvas.ctx.font = this.font();

					const metrics = Canvas.ctx.measureText(this.value);

					// canvas and inkscape letter sizes are the same
					return {
						width: round(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight),
						height: round(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)
					};
				},
				id: that.currentId++,
				toSVG: function() {
					return `
    <text
       xml:space="preserve"
       style="${toStyleString(this.style)}"
       x="${round(this.x)}"
       y="${round(this.y)}"
       id="text${this.id}"><tspan
         sodipodi:role="line"
         id="tspan${this.id}"
         x="${round(this.x)}"
         y="${round(this.y)}">${this.value}</tspan></text>`;
				}
			};
		}
	};

	const Rect = {
		currentId: 0,
		create: function(x, y, width, height, style) {
			const that = this;

			const rect = {
				x: x + NODE_SIZE,
				y: y + NODE_SIZE,
				width: width,
				height: height,
				style: {
					opacity: 1,
					'vector-effect': 'none',
					fill: '#000000',
					'fill-opacity': 1,
					stroke: '#000000',
					'stroke-width': 1,
					'stroke-linecap': 'butt',
					'stroke-linejoin': 'miter',
					'stroke-miterlimit': 1,
					'stroke-dasharray': 'none',
					'stroke-dashoffset': 0,
					'stroke-opacity': 1
				},
				id: that.currentId++,
				idPrefix: 'rect',
				toSVG: function() {
					return `
    <rect
       y="${round(this.y)}"
       x="${round(this.x)}"
       height="${this.height}"
       width="${this.width}"
       id="${this.idPrefix}${this.id}"
       style="${toStyleString(this.style)}" />`;
				}
			};

			if (!style || typeof style != 'object') {
				style = {};
			}
			for (let prop in style) {
				if (rect.style[prop] !== undefined) {
					rect.style[prop] = style[prop];
				}
			}

			return rect;
		}
	};

	function Letter(value) {
		this.text = Text.create(value);
		this.tile = null;
	}
	Letter.prototype.setTile = function(tile) {
		if (this.tile) {
			this.tile.setLetter(null);
		}

		this.tile = tile;
		this.tile.setLetter(this);
		this.align();
	};
	Letter.prototype.align = function() {
		const size = this.text.measure();
		const halfTileHeight = (this.tile.rect.height + this.tile.rect.style['stroke-width']) / 2;

		this.text.x = this.tile.rect.x + ((this.tile.rect.width + this.tile.rect.style['stroke-width'] - size.width) / 2);

		// correct when editing in inkscape, incorrect when making the xml
		// this.text.y = this.tile.rect.y + halfTileHeight + ((halfTileHeight - size.height) / 2);
		// Q is too low (unknown why)
		this.text.y = this.tile.rect.y + halfTileHeight - ((halfTileHeight - size.height) / 2);
	};
	Letter.prototype.toSVG = function() {
		return this.text.toSVG();
	};

	function Letters(style) {
		if (!style || typeof style != 'object') {
			style = {};
		}

		this.style = style;
		this.list = {};
	}
	Letters.prototype.get = function(c, cNo) {
		if (!this.list[c]) {
			this.list[c] = {};// prevents creating empty items in an array
		}
		if (!this.list[c][cNo]) {
			const letter = new Letter(c);

			for (let prop in this.style) {
				if (letter.text.style[prop] !== undefined) {
					letter.text.style[prop] = this.style[prop];
				}
			}

			this.list[c][cNo] = letter;
		}

		return this.list[c][cNo];
	};

	function WordBonus(id, x, y, pointDirection, size, style, trueWord, numTerritories) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.pointDirection = pointDirection;
		this.trueWord = trueWord;
		this.numTerritories = numTerritories;

		this.size = size;
		this.style = {
			fill: '#00ff00',// just so it's clearly visible, gets changed later
			'fill-opacity': 1,
			stroke: '#ffff00',
			'stroke-width': 1,
			'stroke-linecap': 'butt',
			'stroke-linejoin': 'miter',
			'stroke-miterlimit': 4,
			'stroke-dasharray': 'none',
			'stroke-opacity': 1
		};

		if (!style || typeof style != 'object') {
			style = {};
		}
		for (let prop in style) {
			if (this.style[prop] !== undefined) {
				this.style[prop] = style[prop];
			}
		}
	}
	WordBonus.prototype.generatePath = function() {
		// https://www.w3schools.com/graphics/svg_path.asp

		let path;
		const that = this;
		function fix(name) {
			return that[name] + (that.size / 2) + that.style['stroke-width'];
		}

		if (this.pointDirection == 'down') {
			path = `M${fix('x')} ${this.y} l${this.size} 0 l0 ${this.size} l${this.size/2} 0 l-${this.size} ${this.size} l-${this.size} -${this.size} l${this.size/2} 0 Z`;
		}
		else if (this.pointDirection == 'right') {
			path = `M${this.x} ${fix('y')} l${this.size} 0 l0 -${this.size/2} l${this.size} ${this.size} l-${this.size} ${this.size} l0 -${this.size/2} l-${this.size} 0 Z`;
		}

		return path;
	};
	WordBonus.prototype.toSVG = function() {
		return `
    <path
       id="${this.id}"
	   d="${this.generatePath()}"
       style="${toStyleString(this.style)}" />`;
	};

	const TileTypes = {
		normal: 0,
		doubleLetter: 1,
		tripleLetter: 2,
		doubleWord: 3,
		tripleWord: 4,
	};

	function Tile(x, y, size, style) {
		this.rect = Rect.create(x, y, size, size, style);
		this.type = TileTypes.normal;
		this.letter = null;
	}
	Tile.prototype.setLetter = function(letter) {
		if (this.letter && letter) {
			throw new Error('tile is already in use.\ntile id = ' + this.rect.id + '\ntile id 0 = top left; tile id 14 = bottom left\n\nexisting letter = ' + this.letter.text.value + ' id = ' + this.letter.text.id + '\nnew letter = ' + letter.text.value + ' id = ' + letter.text.id + '\nletter ids start at 0. letter ids increment as new letters are placed');
		}

		this.letter = letter;
	};
	Tile.prototype.toSVG = function() {
		return this.rect.toSVG() + (this.letter ? this.letter.toSVG() : '');
	};

	function Board(options) {
		this.gapBetweenTiles = options.gapBetweenTiles;
		this.size = 15;
		this.tiles = {
			size: options.tileSize,
			style: {
				'stroke-width': 1,
			},
			matrix: [],
			tileTypeColors: {
				normal: '#dde9af',
				doubleLetter: '#00ffff',
				tripleLetter: '#0000ff',
				doubleWord: '#ff6600',
				tripleWord: '#ff0000'
			},
			doubleLetter: [
				[0, 3], [0, 11], [2, 6], [2, 8], [3, 0],
				[3, 7], [3, 14], [6, 6], [6, 8], [7, 3],
				[7, 11], [8, 6], [8, 8], [11, 0], [11, 7],
				[11, 14], [12, 6], [12, 8], [14, 3], [14, 11]
			],
			tripleLetter: [
				[1, 5], [1, 9], [5, 1], [5, 5], [5, 9],
				[5, 13], [9, 1], [9, 5], [9, 9], [9, 13],
				[13, 5], [13, 9]
			],
			doubleWord: [
				[1, 1], [1, 13], [2, 2], [2, 12], [3, 3],
				[3, 11], [4, 4], [4, 10], [7, 7], [10, 4],
				[10, 10], [11, 3], [11, 11], [12, 2], [12, 12],
				[13, 1], [13, 13]
			],
			tripleWord: [
				[0, 0], [0, 7], [0, 14], [7, 0], [7, 14],
				[14, 0], [14, 7], [14, 14]
			]
		};
		this.bonuses = {
			size: options.wordBonusSize,
			style: {
				'stroke-width': 1,
				stroke: '#ffff00'
			},
			list: [],
			toSVG: function() {
				let str = '';

				for (let bonus of this.list) {
					str += bonus.toSVG();
				}

				return str;
			}
		};
		this.sizePx = (this.size + 2) * (this.tiles.size + this.tiles.style['stroke-width'] + this.gapBetweenTiles) + this.gapBetweenTiles;
		this.specialBonuses = options.specialBonuses;
	}
	Board.prototype.setTileType = function(x, y, type) {
		const tile = this.tiles.matrix[x][y];
		const color = this.tiles.tileTypeColors[type];

		tile.type = TileTypes[type];
		tile.rect.style.fill = color;
		tile.rect.style.stroke = color;
	};
	Board.prototype.markSpecialTiles = function() {
		for (let tileType in this.tiles.tileTypeColors) {
			if (tileType != 'normal') {
				for (let pos of this.tiles[tileType]) {
					this.setTileType(pos[0], pos[1], tileType);
				}
			}
		}
	};
	Board.prototype.generateWordBonuses = function() {
		let words = {};
		let tmp = {
			currentWord: '',
			numTerritoriesInBonus: 0
		};
		const that = this;

		function main(x, y, pointDirection) {
			const tile = that.tiles.matrix[x][y];

			if (!tmp.currentWord) {
				tmp.numTerritoriesInBonus = 0;
			}

			if (tile.letter) {
				tmp.currentWord += tile.letter.text.value;
				tmp.numTerritoriesInBonus++;
			}

			let nextX;
			let nextY;
			if (pointDirection == 'down') {
				nextX = x;
			}
			else {
				nextX = x + 1;

				if (nextX == that.size) {
					nextX = 0;
				}
			}
			if (pointDirection == 'down') {
				nextY = y + 1;

				if (nextY == that.size) {
					nextY = 0;
				}
			}
			else {
				nextY = y;
			}

			if (nextX < x || nextY < y || !that.tiles.matrix[nextX][nextY].letter) {
				if (tmp.numTerritoriesInBonus > 1) {
					const trueWord = tmp.currentWord[0].toUpperCase() + tmp.currentWord.toLowerCase().substring(1, tmp.currentWord.length);

					if (!words[tmp.currentWord]) {
						words[tmp.currentWord] = {
							list: [],
							idPrefix: 'BonusLink_' + trueWord.replace(/[^a-z0-9]/ig, '')
						};
					}

					const fullSize = (that.bonuses.size + that.bonuses.style['stroke-width']) * 2;// slightly different in inkscape, unclear why
					const width = tile.rect.width + tile.rect.style['stroke-width'];
					const height = tile.rect.height + tile.rect.style['stroke-width'];
					let alignedX;
					let alignedY;

					// +1 from moving bonus left or up by 1
					if (pointDirection == 'down') {
						alignedX = tile.rect.x + ((width - fullSize) / 2);// correct
						alignedY = (that.tiles.matrix[x][y - tmp.numTerritoriesInBonus + 1].rect.y) - height + ((height - fullSize) / 2);// correct
					}
					else {
						alignedX = (that.tiles.matrix[x - tmp.numTerritoriesInBonus + 1][y].rect.x) - width + ((width - fullSize) / 2);// correct
						alignedY = tile.rect.y + ((tile.rect.height - fullSize) / 2);// correct
						// tile.rect.y + ((tile.rect.height + fullSize) / 2); is correct if using inkscape to edit
					}

					words[tmp.currentWord].list.push({x: round(alignedX), y: round(alignedY), pointDirection: pointDirection, trueWord: trueWord, numTerritoriesInBonus: tmp.numTerritoriesInBonus});
				}

				tmp.currentWord = '';
			}
		}

		// does rightwards
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				main(j, i, 'right');
			}
		}

		// does downwards
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				main(i, j, 'down');

				if (i == this.size - 1) {
					tmp.currentWord = '';
				}
			}
		}

		let bonusNo = 0;
		for (let word in words) {
			word = words[word];
			let style = this.bonuses.style;

			if (word.list.length > 1) {
				for (let i = 0; i < word.list.length; i++) {
					const w = word.list[i];

					style.fill = this.decideBonusColor(bonusNo);
					bonusNo++;
					this.bonuses.list.push(new WordBonus(word.idPrefix + (i + 1), w.x, w.y, w.pointDirection, this.bonuses.size, style, w.trueWord, w.numTerritoriesInBonus));
				}
			}
			else {
				const w = word.list[0];

				style.fill = this.decideBonusColor(bonusNo);
				bonusNo++;
				this.bonuses.list.push(new WordBonus(word.idPrefix, w.x, w.y, w.pointDirection, this.bonuses.size, style, w.trueWord, w.numTerritoriesInBonus));
			}
		}
	};
	Board.prototype.decideBonusColor = function(n) {
		const colors = ["#000000","#660000","#CC0000","#006600","#666600","#CC6600","#00CC00","#66CC00","#CCCC00","#000066","#660066","#CC0066","#006666","#666666","#CC6666","#00CC66","#66CC66","#CCCC66","#0000CC","#6600CC","#CC00CC","#0066CC","#6666CC","#CC66CC","#00CCCC","#66CCCC","#CCCCCC"];
		const colorNo = n % colors.length;

		return colors[colorNo];
		/*
		code for deciding these colors
		function colorSquares(numSquares) {
			document.body.innerHTML = '';
			const full = 255;
			const increase = Math.round(51 * 2);// +33 or 44 hex makes a clear enough difference
			let colors = {};

			for (let i = 0; i < numSquares; ) {
				for (let b = 0; b < full; b += increase) {
					for (let g = 0; g < full; g += increase) {
						for (let r = 0; r < full; r += increase) {
							if (i == numSquares) {
								return;
							}

							const color = rgbToHex([r, g, b]);

							if (!colors[color]) {
								colors[color] = 0;
							}

							colors[color]++;

							//console.table('color', color);
							makeSquare(color, i);

							i++;
						}
					}
				}
			}

			return colors;
		}

		function makeSquare(color, i) {
			const square = document.createElement('div');

			square.style.width = '30px';
			square.style.height = '30px';
			square.style.backgroundColor = color;
			square.style.cssFloat = 'left';
			square.innerHTML = i;
			document.body.appendChild(square);
		}

		function rgbToHex(rgb) {
			// https://www.developintelligence.com/blog/2017/02/rgb-to-hex-understanding-the-major-web-color-codes/
			let hex = '#';
			const hexNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F'];

			for (let i = 0; i < rgb.length; i++) {
				const c = rgb[i];
				const division = c / 16;
				const first = Math.floor(division);

				hex += hexNumbers[first];
				hex += hexNumbers[(division - first) * 16];
			}

			return hex;
		}

		function main() {
			const colors = colorSquares(999);
			let arr = [];

			for (let color in colors) {
				arr.push(color);
			}

			console.log(JSON.stringify(arr))
		}

		main();
		*/
	};
	Board.prototype.setTerritoryIds = function() {
		// doesnt do the exclusion of letters their tile
		// id is kept when making exclusion though
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				if (this.tiles.matrix[i][j].letter) {
					this.tiles.matrix[i][j].rect.idPrefix = 'Territory_';
				}
			}
		}
	};
	Board.prototype.makeSpecialBonuses = function() {
		if (!this.specialBonuses.enabled) {
			return;
		}

		this.specialBonuses.components = {
			list: [],
			toSVG: function() {
				let str = '';

				for (let component of this.list) {
					str += component.toSVG();
				}

				return str;
			}
		};

		const that = this;

		function tileWidth(px) {
			// best estimate for x without making manual adjustments

			const fullTileSize = that.tiles.size + that.tiles.style['stroke-width'] + that.gapBetweenTiles;
			let width = 0;

			for (let i = 0; i < that.size; i++) {
				width += fullTileSize;

				if (width > px) {
					break;
				}
			}

			return width;
		}

		function makeSpecialBonus(txt, x) {
			const color = that.tiles.tileTypeColors[toCammelCase(txt)];
			let y = ((that.size + 2) * (that.tiles.size + that.tiles.style['stroke-width'] + that.gapBetweenTiles));

			const label = Text.create(txt);
			label.style['font-family'] = that.specialBonuses.letterFont;
			label.style['font-size'] = that.specialBonuses.letterSize + 'pt';
			label.style['font-weight'] = 'bold';
			label.style.fill = color;

			const labelMetrics = label.measure();
			label.y = y - ((that.tiles.size - labelMetrics.height) / 2);// correct

			y = y - that.tiles.size - that.tiles.style['stroke-width'] + ((that.tiles.size - that.specialBonuses.bonusSize) / 2);// correct

			const bonus = Rect.create(0, y, that.specialBonuses.bonusSize, that.specialBonuses.bonusSize, {fill: color, stroke: that.bonuses.style.stroke});

			label.x = x;
			x += tileWidth(labelMetrics.width);
			bonus.x += x;
			x += tileWidth(bonus.width);

			bonus.id = txt.replace(/\s/, '');
			bonus.idPrefix = 'BonusLink_';

			that.specialBonuses.components.list.push(label);
			that.specialBonuses.components.list.push(bonus);

			return x;
		}

		let x = makeSpecialBonus('Double letter', this.gapBetweenTiles + tileWidth(1));
		x = makeSpecialBonus('Triple letter', x);
		x = makeSpecialBonus('Double word', x);
		x = makeSpecialBonus('Triple word', x);
	};
	Board.prototype.initalise = function() {
		// in inkscape and firefox 0,0 is top left
		const x = this.tiles.size + this.tiles.style['stroke-width'] + this.gapBetweenTiles;
		const y = this.tiles.size + this.tiles.style['stroke-width'] + this.gapBetweenTiles;

		for (let i = 0; i < this.size; i++) {
			this.tiles.matrix[i] = [];

			for (let j = 0; j < this.size; j++) {
				const tile = new Tile((x * (i + 1)) + this.gapBetweenTiles, (y * (j + 1)) + this.gapBetweenTiles, this.tiles.size, this.tiles.style);

				this.tiles.matrix[i][j] = tile;
				this.setTileType(i, j, 'normal');
			}
		}

		this.markSpecialTiles();
	};
	Board.prototype.getMapDetails = function() {
		return {
			territories: this.getTerritoryDetails(),
			bonuses: this.getBonusDetails()
		};
	};
	Board.prototype.getTerritoryDetails = function() {
		let territories = {};
		let names = {};

		function addTerritory(t) {
			// territories must have unique name

			if (!names[t.name]) {
				names[t.name] = 0;
			}

			names[t.name]++;
			if (names[t.name] > 1) {
				if (names[t.name] == 2) {
					for (let id in territories) {
						if (territories[id].name == t.name) {
							territories[id].name += ' 1';
							break;
						}
					}
				}

				t.name += ' ' + names[t.name];
			}

			territories[t.id] = t;
		}

		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const tile = this.tiles.matrix[i][j];
				const y = tile.rect.y + (tile.rect.height / 2) + (tile.rect.height / 4);

				if (tile.letter) {
					addTerritory({
						id: tile.rect.id,
						name: tile.letter.text.value,
						x: tile.rect.x + (tile.rect.width / 2),
						y: y
					});
				}
			}
		}

		return territories;
	};
	Board.prototype.getBonusDetails = function() {
		const that = this;
		function getTilePosition(x, y) {
			function main(check) {
				const fullTileSize = that.tiles.size + that.tiles.style['stroke-width'] + that.gapBetweenTiles;
				for (let i = that.gapBetweenTiles, tileNo = 0; i < that.sizePx; i += fullTileSize) {
					if (i + fullTileSize > check) {
						return tileNo;
					}

					tileNo++;
				}
			}

			return {x: main(x), y: main(y)};
		}

		let bonuses = [];
		console.table('this.bonuses.list', this.bonuses.list);

		for (let bonus of this.bonuses.list) {
			const numTerritoriesInBonus = bonus.numTerritories;
			console.table('bonus', bonus);
			const tileLocation = getTilePosition(bonus.x, bonus.y);// 1 is first real tile, 0 is a fake tile
			console.table('tileLocation', tileLocation);
			let x = tileLocation.x - 1;
			let y = tileLocation.y - 1;

			let Bonus = {
				name: bonus.trueWord,
				color: bonus.style.fill,
				territories: []
			};

			if (bonus.pointDirection == 'down') {
				y++;
				const end = y + numTerritoriesInBonus;

				for ( ; y < end; y++) {
					Bonus.territories.push(this.tiles.matrix[x][y].rect.id);
				}
			}
			else {
				x++;
				const end = x + numTerritoriesInBonus;

				for ( ; x < end; x++) {
					Bonus.territories.push(this.tiles.matrix[x][y].rect.id);
				}
			}
			
			// best estimate for armies without considering position
			if (Bonus.territories.length < 4) {
				Bonus.value = Bonus.territories.length - 1;
			}
			else {
				Bonus.value = Bonus.territories.length - 2;
			}
			
			bonuses.push(Bonus);
		}

		if (!this.specialBonuses.enabled) {
			return bonuses;
		}

		for (let i = 1; i < this.specialBonuses.components.list.length; i += 2) {
			const bonus = this.specialBonuses.components.list[i];
			let Bonus = {
				name: this.specialBonuses.components.list[i - 1].value,
				color: bonus.style.fill,
				territories: []
			};

			for (let pos of this.tiles[toCammelCase(Bonus.name)]) {
				const tile = this.tiles.matrix[pos[0]][pos[1]];

				if (tile.letter) {
					Bonus.territories.push(tile.rect.id);
				}
			}

			Bonus.value = Bonus.territories.length;

			bonuses.push(Bonus);
		}

		return bonuses;
	};
	Board.prototype.toSVG = function() {
		let str = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>

<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   width="${this.sizePx}"
   height="${this.sizePx}"
   version="1.1">
  <defs
     id="defs5187" />
  <sodipodi:namedview
     id="base"
     pagecolor="#000000"
     bordercolor="#666666"
     borderopacity="1.0"
     inkscape:pageopacity="0"
     inkscape:pageshadow="2"
     inkscape:zoom="0.5"
     inkscape:cx="${this.sizePx / 2}"
     inkscape:cy="${this.sizePx / 2}"
     inkscape:document-units="px"
     inkscape:current-layer="layer1"
     showgrid="false"
     units="px"
     inkscape:pagecheckerboard="false"
     showborder="true"
     inkscape:window-maximized="1"
     showguides="true"
     inkscape:guide-bbox="true"
     inkscape:measure-start="0,0"
     inkscape:measure-end="0,0"
     fit-margin-top="0"
     fit-margin-left="0"
     fit-margin-right="0"
     fit-margin-bottom="0">${generateGuides(this)}
  </sodipodi:namedview>
  <g
     inkscape:label="Layer 1"
     inkscape:groupmode="layer"
     id="layer1">`;

		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				str += this.tiles.matrix[i][j].toSVG();
			}
		}

		str += this.bonuses.toSVG();
		
		if (this.specialBonuses.enabled) {
			str += this.specialBonuses.components.toSVG();
		}

		str += `
  </g>
</svg>`;

		return str;
	};

	function generateGuides(board) {
		let currentGuideId = -1;
		let str = '';
		const stdTileFullWidth = board.tiles.size + board.tiles.style['stroke-width'];
		const numGuides = (board.size + 2);

		function main(i, horz) {
			currentGuideId++;
			const orientation = horz ? '1,0' : '0,1';
			const pos = board.gapBetweenTiles + ((stdTileFullWidth + board.gapBetweenTiles) * i) + (stdTileFullWidth / 2);
			const position = horz ? pos + ',0' : '0,' + pos;

			str += `
    <sodipodi:guide
       position="${position}"
       orientation="${orientation}"
       id="guide${currentGuideId}"
       inkscape:locked="false"
       inkscape:label=""
       inkscape:color="rgb(0,0,255)" />`;
		}

		for (let i = 0; i < numGuides; i++) {
			main(i, true);
		}
		for (let i = 0; i < numGuides; i++) {
			main(i, false);
		}

		return str;
	}

	createCanvas();

	/*
	function inscapeAndCanvasLetterSizesAreEqual() {
		// inkscape letter sizes for Courier New 28pt bold in px A to Z
		// test shows they are equal
		const inkscapeLetterSizes = [
			{width: 24.099, height: 22.112},
			{width: 20.927, height: 22.112},
			{width: 19.979, height: 23.206},
			{width: 20.089, height: 22.112},
			{width: 20.089, height: 22.112},
			{width: 20.089, height: 22.112},
			{width: 21.018, height: 23.206},
			{width: 20.964, height: 22.112},
			{width: 16.279, height: 22.112},
			{width: 20.909, height: 22.659},
			{width: 22.094, height: 22.112},
			{width: 20.198, height: 22.112},
			{width: 23.971, height: 22.112},
			{width: 22.422, height: 22.112},
			{width: 20.945, height: 23.206},
			{width: 19.323, height: 22.112},
			{width: 20.964, height: 28.182},
			{width: 22.659, height: 22.112},
			{width: 17.846, height: 23.206},
			{width: 19.359, height: 22.112},
			{width: 21.656, height: 22.659},
			{width: 24.117, height: 22.112},
			{width: 23.242, height: 22.112},
			{width: 21.711, height: 22.112},
			{width: 20.909, height: 22.112},
			{width: 17.008, height: 22.112}
		];
		const canvasLetterSizes = [
			new Letter('A').text.measure(),
			new Letter('B').text.measure(),
			new Letter('C').text.measure(),
			new Letter('D').text.measure(),
			new Letter('E').text.measure(),
			new Letter('F').text.measure(),
			new Letter('G').text.measure(),
			new Letter('H').text.measure(),
			new Letter('I').text.measure(),
			new Letter('J').text.measure(),
			new Letter('K').text.measure(),
			new Letter('L').text.measure(),
			new Letter('M').text.measure(),
			new Letter('N').text.measure(),
			new Letter('O').text.measure(),
			new Letter('P').text.measure(),
			new Letter('Q').text.measure(),
			new Letter('R').text.measure(),
			new Letter('S').text.measure(),
			new Letter('T').text.measure(),
			new Letter('U').text.measure(),
			new Letter('V').text.measure(),
			new Letter('W').text.measure(),
			new Letter('X').text.measure(),
			new Letter('Y').text.measure(),
			new Letter('Z').text.measure()
		];
		let allSameSize = true;

		const toCheck = ['width', 'height'];
		for (let i = 0; i < window.canvasLetterSizes.length; i++) {
			const inkscapeSize = window.inkscapeLetterSizes[i];
			const canvasSize = window.canvasLetterSizes[i];

			for (let metric of toCheck) {
				if (canvasSize[metric] != inkscapeSize[metric]) {
					console.warn('letter ' + i + ' ' + metric + ' for canvas different from inkscape');
					allSameSize = false;
				}
			}
		}

		return allSameSize;
	}
	*/

	function checkLetterTotals(overrideScrabbleLetterLimits, blank1, blank2) {
		function getLetterIndex(c) {
			return c.toUpperCase().charCodeAt() - 'A'.charCodeAt();
		}

		if (overrideScrabbleLetterLimits && (blank1 || blank2)) {
			throw new Error('dont use blanks when overrideScrabbleLetterLimits enabled, letters will be created as needed');
		}
		else if (!overrideScrabbleLetterLimits) {
			if (typeof blank1 != 'string' || typeof blank2 != 'string' || !blank1.match(/^[a-z]$/i) || !blank2.match(/^[a-z]$/i)) {
				throw new Error('blanks must be defined when keeping to normal scrabble letter distributions');
			}

			let letterTotals = [9, 2, 2, 4, 12, 2, 3, 2, 9, 1, 1, 4, 2, 6, 8, 2, 1, 6, 4, 6, 4, 2, 2, 1, 2, 1];
			letterTotals[getLetterIndex(blank1)]++;
			letterTotals[getLetterIndex(blank2)]++;

			return letterTotals;
		}
	}

	const placements = [];
	let placementTtNoTracker = {};

	function doLetterPlacements(overrideScrabbleLetterLimits, letterTotals, letters, board) {
		let usedLetters = {};
		for (let p of placements) {
			if (!overrideScrabbleLetterLimits) {
				if (!p.letter.match(/^[a-z]$/i)) {
					throw new Error('letters must be a single letter in the English alphabet when keeping to normal scrabble letter limits');
				}

				if (!usedLetters[p.letter]) {
					usedLetters[p.letter] = 0;
				}

				usedLetters[p.letter]++;

				if (usedLetters[p.letter] > letterTotals['A'.charCodeAt() - p.letter.charCodeAt()]) {
					throw new Error('using too many of the same letters. attempted to use a extra ' + p.letter);
				}
			}

			letters.get(p.letter, p.letterNo).setTile(board.tiles.matrix[p.x][p.y]);
		}
	}

	if (!window.createSVG) {
		window.createSVG = {};
	}

	window.createSVG.clearPlacements = function() {
		for (let i = placements.length - 1; i > -1; i--) {
			placements.pop();
		}

		for (let key in placementTtNoTracker) {
			delete placementTtNoTracker[key];
		}
	};

	window.createSVG.place = function(p) {
		/* p = {
			tt: string tileText case-insensitive
			x: int x in number of tiles. 0 = leftmost 14 = rightmost
			y: int y in number of tiles. 0 = topmost 14 = bottommost
		*/
		let letter = p.tt;
		let x = p.x;
		let y = p.y;

		if (typeof letter != 'string' || letter.match(/\s/)) {
			throw new Error('letter must be defined and not contain spaces');
		}

		letter = letter.toUpperCase();
		x = parseInt(x);
		y = parseInt(y);

		const boardSize = 14;

		if (!isFinite(x) || !isFinite(y) || x < 0 || y < 0 || x > boardSize || y > boardSize) {
			throw new Error('x and y must be a number between 0 and ' + boardSize);
		}

		if (!placementTtNoTracker[letter]) {
			placementTtNoTracker[letter] = 0;
		}

		placements.push({letter: letter, letterNo: placementTtNoTracker[letter], x: x, y: y});
		placementTtNoTracker[letter]++;
	};
	window.createSVG.run = function() {
		// checks if too many of the same letter used
		// checks if more than 1 letter in same place

		const letters = new Letters({
			'font-family': window.createSVG.settings.options.letterFont,
			'font-size': window.createSVG.settings.options.letterSize + 'pt',
			'font-weight': 'bold'
		});
		const letterTotals = checkLetterTotals(window.createSVG.settings.overrideScrabbleLetterLimits, window.createSVG.settings.blank1, window.createSVG.settings.blank2);
		const board = new Board(window.createSVG.settings.options);

		board.initalise();

		doLetterPlacements(window.createSVG.settings.overrideScrabbleLetterLimits, letterTotals, letters, board);

		board.generateWordBonuses();
		board.setTerritoryIds();
		board.makeSpecialBonuses();

		window.Board = board;

		return {svg: board.toSVG(), detailsForAPI: JSON.stringify(board.getMapDetails())};
	};

	// 0-2 bonus arrows per 'tile' depending on how letters placed, easier to let human sort out this conflict
	// will need to be opened in inkscape to do Path > Exclusion on each tile occupied with a letter
	// can read the bonus colors from the file and set it as the bonus color using api
	// human needs to move specialBonuses to a good position and convert the text to path
})();
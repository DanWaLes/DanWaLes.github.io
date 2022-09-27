(() => {
	function round(n) {
		// inkscape rounds to 3dp, lets do the same here
		return Math.round(n * 1000 + Number.EPSILON) / 1000;
	}

	function checkRunOptions(options) {
		/*
		options = {
			tileSize: float in px. min is 32
			letterSize: float in pt. min is 12. max is tileSize in pt
			wordBonusSize: float in px. min is 16. max is tileSize
			gapBetweenTiles: float in px. min is 0
			letterFont: string
			specialBonuses: {
				enabled: boolean default is false
				bonusSize: float in px. min is 16. max is tileSize
				letterSize: float in pt. min is 12. should not go off-screen
				letterFont: string
			}
		}
		*/

		function pxToPt(px) {
			// https://convertermaniacs.com/pixel-to-point/convert-16-px-to-pt.html
			if (!isFinite(px)) {
				return;
			}

			return px * (3 / 4);
		}

		const minBonusSize = 16;
		const doubleMinBonusSize = minBonusSize * 2;
		const minBonusSizeInPt = pxToPt(minBonusSize);

		if (!options) {
			options = {};
		}
		options.tileSize = round(parseFloat(options.tileSize));
		options.wordBonusSize = round(parseFloat(options.wordBonusSize));
		options.letterSize = round(parseFloat(options.letterSize));
		options.gapBetweenTiles = round(parseFloat(options.gapBetweenTiles));

		const tileSizeInPt = pxToPt(options.tileSize);

		if (!isFinite(options.tileSize) || options.tileSize < doubleMinBonusSize) {
			throw new Error('tile size must be entered and be at least ' + doubleMinBonusSize);
		}
		if (!isFinite(options.wordBonusSize) || options.wordBonusSize < minBonusSize || options.wordBonusSize > options.tileSize) {
			throw new Error('bonus size must be entered and be between ' + minBonusSize + ' and ' + options.tileSize);
		}
		if (!isFinite(options.letterSize) || options.letterSize < minBonusSizeInPt || options.letterSize > tileSizeInPt) {
			throw new Error('letter size must be entered and be between ' + minBonusSizeInPt + ' and ' + tileSizeInPt);
		}
		if (!isFinite(options.gapBetweenTiles) || options.gapBetweenTiles < 0) {
			throw new Error('gap between tiles size must be entered and be at least 0');
		}
		if (!options.letterFont || typeof options.letterFont != 'string') {
			throw new Error('letter font must be a string');
		}
		// quote fonts - needed for spaced, optional otherwise
		options.letterFont = "'" + options.letterFont + "'";

		if (!options.specialBonuses || typeof options.specialBonuses != 'object') {
			options.specialBonuses = {};
		}
		options.specialBonuses.enabled = !!options.specialBonuses.enabled;
		if (!options.specialBonuses.enabled) {
			return options;// can skip checking
		}
		options.specialBonuses.bonusSize = round(parseFloat(options.specialBonuses.bonusSize));
		options.specialBonuses.letterSize = round(parseFloat(options.specialBonuses.letterSize));

		if (!isFinite(options.specialBonuses.letterSize) || options.specialBonuses.letterSize < minBonusSizeInPt || options.specialBonuses.letterSize > tileSizeInPt) {
			throw new Error('special bonuses letter size must be entered and be between ' + minBonusSizeInPt + ' and ' + tileSizeInPt);
		}
		if (!isFinite(options.specialBonuses.bonusSize) || options.specialBonuses.bonusSize < minBonusSize || options.specialBonuses.bonusSize > options.tileSize) {
			throw new Error('special bonuses bonus size must be entered and be between ' + minBonusSize + ' and ' + options.tileSize);
		}
		if (!options.specialBonuses.letterFont || typeof options.specialBonuses.letterFont != 'string') {
			throw new Error('special bonuses letter font must be a string');
		}
		// quote fonts - needed for spaced, optional otherwise
		options.specialBonuses.letterFont = "'" + options.specialBonuses.letterFont + "'";

		return options;
	}

	if (!window.createSVG) {
		window.createSVG = {};
	}

	function readCreateSVGSettings() {
		const form = document.forms.createSVG;
		const overrideScrabbleLetterLimits = form.nsll.checked;
		const blank1 = form.blank1.value;
		const blank2 = form.blank2.value;
		const options = checkRunOptions({
			tileSize: form.ts.value,
			letterSize: form.fs.value,
			wordBonusSize: form.wbs.value,
			gapBetweenTiles: form.gbt.value,
			letterFont: form.ff.value,
			specialBonuses: {
				enabled: form.sb.checked,
				bonusSize: form.sbbs.value,
				letterSize: form.sbfs.value,
				letterFont: form.sbff.value
			}
		});

		window.createSVG.settings = {
			overrideScrabbleLetterLimits: overrideScrabbleLetterLimits,
			blank1: blank1,
			blank2: blank2,
			options: options
		};
	}

	window.createSVG.fromJSONString = function(str) {
		if (document.readyState != 'complete') {
			return setTimeout(() => {
				window.createSVG.fromJSONString(str);
			}, 500);
		}

		const exe = JSON.parse(str);

		if (!exe.settings || typeof exe.settings != 'object') {
			return;
		}
		if (!Array.isArray(exe.placements)) {
			exe.placements = [];
		}

		exe.settings.options = checkRunOptions(exe.settings.options);

		const form = document.forms.createSVG;
		form.nsll.checked = exe.settings.overrideScrabbleLetterLimits;
		form.blank1.value = exe.settings.blank1;
		form.blank2.value = exe.settings.blank2;
		form.ts.value = exe.settings.options.tileSize;
		form.fs.value = exe.settings.options.letterSize;
		form.wbs.value = exe.settings.options.wordBonusSize;
		form.gbt.value = exe.settings.options.gapBetweenTiles;
		form.ff.value = exe.settings.options.letterFont.replace(/^'/, '').replace(/'$/, '');
		form.sb.checked = exe.settings.options.specialBonuses.enabled;
		form.sbbs.value = exe.settings.options.specialBonuses.bonusSize;
		form.sbfs.value = exe.settings.options.specialBonuses.letterSize;
		form.sbff.value = exe.settings.options.specialBonuses.letterFont.replace(/^'/, '').replace(/'$/, '');

		window.createSVG.settings = {
			overrideScrabbleLetterLimits: exe.settings.overrideScrabbleLetterLimits,
			blank1: exe.settings.blank1,
			blank2: exe.settings.blank2,
			options: exe.settings.options
		};

		if (!exe.placements.length) {
			return;
		}

		window.createSVG.clearPlacements();

		for (let p of exe.placements) {
			window.createSVG.place(p);
		}

		downloadMap();
	}
	
	function makeWordBonus(pointDirection, cd) {
		const style = {
			fill: '#00ff00',// just so it's clearly visible
			'fill-opacity': 1,
			stroke: '#ffff00',
			'stroke-width': 1,
			'stroke-linecap': 'butt',
			'stroke-linejoin': 'miter',
			'stroke-miterlimit': 4,
			'stroke-dasharray': 'none',
			'stroke-opacity': 1
		};
		const size = window.createSVG.settings.options.wordBonusSize;

		let path;

		function fix(name) {
			return cd[name] + (size / 2) + style['stroke-width'];
		}

		if (pointDirection == 'down') {
			path = `M${fix('x')} ${cd.y} l${size} 0 l0 ${size} l${size/2} 0 l-${size} ${size} l-${size} -${size} l${size/2} 0 Z`;
		}
		else {
			path = `M${cd.x} ${fix('y')} l${size} 0 l0 -${size/2} l${size} ${size} l-${size} ${size} l0 -${size/2} l-${size} 0 Z`;
		}

		let styleStr = '';
		for (let prop in style) {
			styleStr += prop + ':' + style[prop] + ';'
		}

		return `<path d="${path}" style="${styleStr}" />`;
	}
	
	function cropSVG(svgEl) {
		// modified from https://stackoverflow.com/questions/50813950/how-do-i-make-an-svg-size-to-fit-its-content#answer-73500052
		// Get the bounds of the SVG content
		const bbox = svgEl.getBBox();
		// Set the viewport with these bounds
		svgEl.setAttribute('width', bbox.width);
		svgEl.setAttribute('height', bbox.height);
	}
	
	function preview() {
		readCreateSVGSettings();

		const previewArea = document.getElementById('preview');
		const tiles = previewArea.querySelectorAll('.tile');
		const wordBonus = previewArea.querySelector('#wordBonus');
		const specialBonus = previewArea.querySelector('#specialBonus');

		for (let tile of tiles) {
			tile.style.fontFamily = "'" + window.createSVG.settings.options.letterFont + "'";
			tile.style.fontSize = window.createSVG.settings.options.letterSize + 'pt';
			tile.style.backgroundColor = '#dde9af';
			tile.style.border = '1px solid ' + tile.style.backgroundColor;
			tile.style.textAlign = 'center';
			tile.style.lineHeight = '1em';
			tile.style.width = window.createSVG.settings.options.tileSize + 'px';
			tile.style.height = tile.style.width;
			tile.style.maxWidth = tile.style.width;
			tile.style.maxHeight = tile.style.width;
			tile.style.margin = (window.createSVG.settings.options.gapBetweenTiles / 2) + 'px';
			tile.style.cssFloat = 'left';
		}

		wordBonus.innerHTML = '';
		wordBonus.innerHTML += makeWordBonus('down', {x: 0, y: 0});
		wordBonus.innerHTML += makeWordBonus('right', {x: (window.createSVG.settings.options.wordBonusSize + 1) * 2 , y: 0});

		specialBonus.innerHTML = '';

		const bonusLabel = document.createElement('span');
		bonusLabel.innerHTML = 'Double letter';
		bonusLabel.style.fontFamily = "'" + window.createSVG.settings.options.specialBonuses.letterFont + "'";
		bonusLabel.style.fontSize = window.createSVG.settings.options.specialBonuses.letterSize + 'pt';
		bonusLabel.style.color = '#00ffff';

		const bonus = document.createElement('div');
		bonus.style.border = '1px solid #ffff00';
		bonus.style.backgroundColor = bonusLabel.style.color;
		bonus.style.width = window.createSVG.settings.options.specialBonuses.bonusSize + 'px';
		bonus.style.height = bonus.style.width;

		specialBonus.appendChild(bonusLabel);
		specialBonus.appendChild(bonus);

		previewArea.style.display = 'block';
		cropSVG(wordBonus);
	}

	function readCreateSVGplacements() {
		window.createSVG.clearPlacements();

		const placements = document.forms.createSVG.placements;
		const lines = placements.list.value.split(/\n+/);

		for (let line of lines) {
			// line in this format: tileText x y
			const lineDetails = line.replace(/^\s+(\s+$)/g, '').split(/\s+/);
			if (lineDetails.length != 3) {
				throw new Error('line incorrectly formatted. use "tileText x y" format');
			}

			const tileText = lineDetails[0];
			const x = lineDetails[1];
			const y = lineDetails[2];

			const p = {
				tt: tileText,
				x: x,
				y: y
			};

			window.createSVG.place(p);
		}
	}
	
	function download(contents, filename, type) {
		const types = {
			"txt": "text/plain",
			"html": "text/html",
			"json": "application/json",
			"svg": "image/svg+xml"
		};

		if (typeof contents != "string") {
			console.exception("contents must be a string");
			return;
		}
		if (typeof filename != "string") {
			console.exception("filename must be a string");
			return;
		}

		const mimeType = types[type];

		if (!mimeType) {
			console.exception(`file type ${type} is unsupported`);
			return;
		}

		const blob = new Blob([contents], {type: mimeType});
		const downloadLink = document.createElement('a');

		downloadLink.download = filename + '.' + type;
		downloadLink.href = window.URL.createObjectURL(blob);
		downloadLink.onclick = function(e) {
			setTimeout(function()
			{
				window.URL.revokeObjectURL(downloadLink.href);
			}, 1500);
		};

		document.body.appendChild(downloadLink);
		downloadLink.click();
		downloadLink.remove();
	}

	function downloadMap() {
		const scrabblemap = window.createSVG.run();

		download(scrabblemap.svg, 'map', 'svg');
		download(scrabblemap.detailsForAPI, 'mapDetailsForAPI', 'json');
	}
	
	function getMapId(link) {
		try {
			const match = link.match(/^(?:https?:\/\/)?(?:www\.)?(?:(?:warzone\.com)|(?:warlight\.net))\/play\?PreviewMap=(\d+)$/i);

			if (!match) {
				throw new Error('Invalid map link');
			}

			return parseInt(match[1]);
		}
		catch(err) {
			throw err;
		}
	}

	function getFileContent(file) {
		return new Promise((resolve, reject) => {
			// based on https://codereview.stackexchange.com/questions/183030/loading-parsing-and-displaying-a-json-file
			const fr = new FileReader();

			fr.readAsText(file);
			fr.onload = function(e) {
				resolve(e.target.result);
			};
		});
	}

	async function mapDetailsFormSubmitted() {
		const form = document.forms.enterMapDetails;
		const output = document.getElementById('output');

		output.innerHTML = '';

		try {
			const mapDetailsJSONString = await getFileContent(form.mapDetails.files[0]);

			window.enterMapDetails.setEmail(form.email.value);
			window.enterMapDetails.setApiToken(form.apiToken.value);
			window.enterMapDetails.setMapId(getMapId(form.mapLink.value));
			window.enterMapDetails.setMapDetailsJSONString(mapDetailsJSONString);
		}
		catch(err) {
			console.exception(err);
			output.innerHTML = err.name + ' ' + err.message;
		}
		finally {
			// for sense of security
			form.email.value = '';
			form.apiToken.value = '';
		}
	}

	function pageLoaded() {
		if (document.readyState != 'complete') {
			return setTimeout(pageLoaded, 500);
		}

		document.forms.createSVG.onsubmit = () => {
			readCreateSVGSettings();
			readCreateSVGplacements();
			downloadMap();
		};
		document.forms.createSVG.preview.onclick = preview;
		document.forms.createSVG.hidePreview.onclick = () => {
			document.getElementById('preview').style.display = 'none';
		};

		document.forms.enterMapDetails.onsubmit = mapDetailsFormSubmitted;
	}

	pageLoaded();
})();
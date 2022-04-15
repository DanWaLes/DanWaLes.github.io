(() => {
	// each character must be 5 lines tall
	// each row of a character must be equal to that of the longest one in that character
	const letters = {
		a: ['   / \\', '   ---', '  /   \\', ' /     \\', '/       \\'],
		b: [' --', '|  |', ' --', '|  |', ' --'],
		c: [' --', '|', '|', '|', ' --'],
		d: [' --', '|  \\', '|  |', '|  /', ' --'],
		e: [' --', '|', ' --', '|', ' --'],
		f: [' --', '|', ' --', '|', '|'],
		g: [' --', '/', '| -', '\\  |', ' --/'],
		h: ['|  |', '|  |', ' --', '|  |', '|  |'],
		i: ['---', ' |', ' |', ' |' , '---'],
		j: ['  |', '  |', '  |', '  |', '\\-/'],
		k: ['|  /', '| /', '|/', '|\\', '| \\'],
		l: ['|', '|', '|', '|', ' ---'],
		m: ['|\\  /|', '| \\/ |', '|    |', '|    |', '|    |'],
		n: ['|\\    |', '| \\   |', '|  \\  |', '|   \\ |', '|    \\|'],
		o: [' ---', '|   |', '|   |', '|   |', ' ---'],
		p: [' --', '|  |', '|--', '|', '|'],
		q: [' ---', '|   |', '|   |', '|   |', ' --\\'],
		r: [' --', '|  |', '|--', '|  \\', '|   \\'],
		s: [' --', '|', ' --', '   |', ' --'],
		t: ['---', ' |', ' |', ' |', ' |'],
		u: ['|  |', '|  |', '|  |', '|  |', ' --'],
		v: ['\\        /', ' \\      /', '  \\    /', '   \\  /', '    \\/'],
		w: ['\\        /\\        /', ' \\      /  \\      /', '  \\    /    \\    /', '   \\  /      \\  /', '    \\/        \\/'],
		x: ['\\    /', ' \\  /', '  \\/', '  /\\', ' /  \\'],
		y: ['\\   /', ' \\ /', '  |', '  |', '  |'],
		z: ['----', '   /', '  /', ' /', '----']
	};
	const symbols = {
		'>': ['-', ' -', '  -', ' -' , '-'],
		'<': ['  -', ' -', '-', ' -' , '  -'],
		'.': ['', '', '', '', '-'],
		',': ['', '', '', '', '/'],
		';': ['-', '', '', '', '/'],
		':': ['-', '', '', '', '-'],
		'!': ['|', '|', '|', '', '-'],
		'?': ['/-\\', '  /', ' |', '', ' -'],
		'[': [' -', '|', '|', '|', ' -'],
		']': ['-', ' |', ' |', ' |', '-'],
		'(': [' /', '|', '|', '|', ' /'],
		')': ['\\', ' |', ' |', ' |', '\\'],
		'{': ['  -', ' |', '-', ' |', '  -'],
		'}': ['-', ' |', '  -', ' |', '-'],
		'+': ['  |', '  |', '--|--', '  |', '  |'],
		'-': ['', '', '-', '', ''],
		'=': ['', '-', '', '-', ''],
		'_': ['', '', '', '', '--'],
		'"': ['||', '', '', '', ''],
		"'": ['|', '', '', '', ''],
		'`': ['\\', '', '', '', ''],
		'*': ['   /\\', '  /  \\', '/-    -\\', '\-    -/', '  \/\/'],
		'&': ['  /\\', '  \\/', '  /\\/-', ' / /\\', '--/  -'],
		'#': ['     /  /', '  --/--/--', '   /  /', '--/--/--', ' /  /'],
		'^': ['/\\', '', '', '', ''],
		'%': [' -  /', '| |/', ' -/-', ' /| |', '/  -']
	};
	const numbers = {
		0: [' -', '| |', '| |', '| |', ' -'],
		1: ['|', '|', '|', '|', '|'],
		2: ['---\\', '   /', '  /', ' /', '\\---'],
		3: ['--', '  |', ' -', '  |', '--'],
		4: ['  -', ' / |', '/  |', '-----', '   |'],
		5: [' --', '|', ' --', '   |', ' --'],
		6: [' --', '|', ' --', '|  |', ' -'],
		7: ['----', '   /', '  /', ' /', '/'],
		8: [' --', '|  |', ' --', '|  |', ' --'],
		9: [' --', '|  |', ' --', '   |', ' --']
	};

	const numRows = 5;

	function fixWidth(list) {
		for (let c in list) {
			const cRows = list[c];

			for (let i = 0; i < cRows.length; i++) {
				let j = 0;
				let longestRowLength = 0;

				while (j < numRows) {
					if (cRows[j].length > longestRowLength) {
						longestRowLength = cRows[j].length;
					}

					j++;
				}

				j = 0;
				while (j < numRows) {
					while (cRows[j].length < longestRowLength) {
						cRows[j] += ' ';
					}

					j++;
				}
			}
		}
	}

	fixWidth(letters);
	fixWidth(symbols);
	fixWidth(numbers);

	function linesToString(lines) {
		let linesInTextForm = '';

		for (let i = 0; i < lines.length; i++) {
			for (let j = 0; j < numRows; j++) {
				const theLine = lines[i][j].join('');

				linesInTextForm += theLine;

				if (theLine && j + 1 < numRows) {
					linesInTextForm += '\n';
				}
			}

			if (i + 1 < lines.length) {
				linesInTextForm += '\n';
			}
		}

		return linesInTextForm;
	}

	function textToLines(str) {
		let lines = [
			[
				[], [], [], [], []
			]
		];
		let lineCounter = 0;

		function addMarker(marker) {
			// before and after each letter, symbol and number

			for (let a = 0; a < numRows; a++) {
				lines[lineCounter][a].push(' ' + marker + ' ');
			}
		}
		function addChar(c, orginal) {
			const isUpperCase = typeof orginal == 'string' && orginal == orginal.toUpperCase();
			const upperCaseMarker = ['W', 'a', 't', 'e', 'r'];

			for (let a = 0; a < numRows; a++) {
				lines[lineCounter][a].push((isUpperCase ? upperCaseMarker[a] : '') + c[a]);
			}
		}

		for (let i = 0; i < str.length; i++) {
			const c = str[i];
			const letterInLineForm = letters[c.toLowerCase()];
			const symbolInLineForm = symbols[c];
			const numberInLineForm = numbers[c];

			if (letterInLineForm) {
				addMarker('>');
				addChar(letterInLineForm, c);
				addMarker('>');
			}
			else if (symbolInLineForm) {
				addMarker('<');
				addChar(symbolInLineForm);
				addMarker('<');
			}
			else if (numberInLineForm) {
				addMarker('^');
				addChar(numberInLineForm);
				addMarker('^');
			}
			else if (c == '\n') {
				lines.push([[], [], [], [], []]);
				lineCounter++;
			}
			else {
				for (let a = 0; a < numRows; a++) {
					lines[lineCounter][a].push(c);
				}
			}
		}

		return linesToString(lines);
	}
	window.textToLines = textToLines;

	function encrypt(lines) {
		const bylines = lines.split('\n');
		let optimized = [];

		for (let i = 0; i < bylines.length; ) {
			const line = bylines[i];

			if (line) {
				// data line
				for (let j = 0; j < line.length; j++) {
					const firstC = line[j];
					let numSame = 1;
					let chars = [firstC];

					for (let k = 1; k < numRows; k++) {
						const c = bylines[i + k][j];

						chars.push(c);

						if (firstC == c) {
							numSame++;
						}
					}

					if (numSame == numRows) {
						optimized.push(firstC);
					}
					else {
						if (optimized[optimized.length - 1] == 'o') {
							optimized[optimized.length - 1] = 't';
						}
						else {
							optimized.push('s');
						}

						for (let c of chars) {
							optimized.push(c);
						}

						optimized.push('o');
					}
				}

				i+= numRows;
			}
			else {
				// empty line
				i++;
			}

			if (i + 1 < bylines.length) {
				optimized.push('\n');
			}
		}

		function doShorthadMarkers() {
			const markers = ['>', '<', '^'];
			const shorthand = ['r', 'm', 'y'];
			let txt = optimized.join('');

			for (let i = 0; i < markers.length; i++) {
				const marker = markers[i];

				txt = txt.replace(new RegExp(' ' + marker + '  ' + marker + ' ', 'g'), shorthand[i]);
			}

			return txt;
		}

		return doShorthadMarkers();
	}

	function decrypt(str) {
		let deoptimized = [
			[
				[], [], [], [], []
			]
		];
		let lineCounter = 0;

		function fillLines(str, strRelToPos) {
			for (let a = 0; a < numRows; a++) {
				deoptimized[lineCounter][a].push((strRelToPos ? str[a] : str));
			}
		}
		function doMarker(c) {
			const markers = {
				r: '>',
				m: '<',
				y: '^'
			};
			const m = ' ' + markers[c] + ' ';

			fillLines(m + m);
		}

		for (let i = 0; i < str.length; i++) {
			const c = str[i];

			if (c == '\n') {
				deoptimized.push([[], [], [], [], []]);
				lineCounter++;
			}
			else if (['s', 't'].includes(c)) {
				const differentChars = str.substring(i + 1, i + 1 + numRows);

				fillLines(differentChars, true);
				i += numRows;
			}
			else if (c == 'o') {
				// dont need to do anything
			}
			else if (['r', 'm', 'y'].includes(c)) {
				doMarker(c);
			}
			else {
				fillLines(c);
			}
		}

		return linesToString(deoptimized);
	}

	function linesToText(str) {
		function charToText(c, charType, isUpperCase) {
			for (let key in charType) {
				const character = charType[key];
				if (character[0].length == c[0].length) {
					// should be faster with above check
					if (character.join('') == c.join('')) {
						if (isUpperCase) {
							return key.toUpperCase();
						}

						return key;
					}
				}
			}

			console.table('c', c);
			console.table('charType', charType);
			throw new Error('c not found');
		}

		const lines = str.split('\n');
		const markers = [' > ', ' < ', ' ^ '];
		let txt = '';

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			for (let j = 0; j < line.length; ) {
				let chars3;
				if (j + 2 < line.length) {
					chars3 = line.substring(j, j + 3);
				}
				const markerIndex = markers.indexOf(chars3);
				const charType = markerIndex == 0 ? letters : markerIndex == 1 ? symbols : markerIndex == 2 ? numbers : null;
				const c = ['', '', '', '', ''];

				if (charType) {
					j += 3;

					let buildingC = true;
					let isUpperCase;
					let isFirstLine = true;

					while (buildingC) {
						let lastChars3;
						if (j + 2 < line.length) {
							lastChars3 = line.substring(j, j + 3);
						}

						if (chars3 == lastChars3) {
							j += 3;
							txt += charToText(c, charType, isUpperCase);
							buildingC = false;
						}
						else {
							for (let a = 0; a < numRows; a++) {
								c[a] += lines[i + a][j];
							}

							if (isFirstLine) {
								isUpperCase = c.join('') == 'Water';

								if (isUpperCase) {
									for (let a = 0; a < numRows; a++) {
										c[a] = '';
									}
								}
							}

							j++;
						}

						isFirstLine = false;

						if (j > line.length) {
							// was caused due to forgetting to add marker end in decrypt - is fixed now
							console.table('str', str);
							console.table('txt', txt);
							console.table('i', i);
							console.table('j', j);
							throw new Error('forced stop, prevented infinite loop');
						}
					}
				}
				else {
					// is plain text
					txt += line[j];
					j++;
				}

				if (j == line.length) {
					i += numRows - 1;// -1 because incremented at end
				}
			}

			if (i + 1 < lines.length) {
				txt += '\n';
			}
		}

		return txt;
	}

	const subtitutions = {
		encode: {
			'-': 'A',
			' ': 'N',
			'/': 'C',
			'\\': 'H',
			'>': 'O',
			'|': 'R',
			'<': 'E',
			'^': 'D'
		},
		decode: {}
	};
	for (let key in subtitutions.encode) {
		subtitutions.decode[subtitutions.encode[key]] = key;
	}

	function subtitute(str, mode) {
		if (!(mode in subtitutions)) {
			throw new Error('invalid mode');
		}

		str = str.split('');

		for (let i = 0; i < str.length; i++) {
			if (subtitutions[mode][str[i]]) {
				str[i] = subtitutions[mode][str[i]];
			}
		}

		return str.join('');
	}
	//decode(encode('L8\n85~k\n\nk')) == 'L8\n85~k\n\nk' > true
	function encode(str) {
		return subtitute(encrypt(textToLines(str)), 'encode');
	}
	function decode(str) {
		return linesToText(decrypt(subtitute(str, 'decode')));
	}

	window['I-sea'] = {
		subtitute: subtitute,
		textToLines: textToLines,
		encrypt: encrypt,
		encode: encode,
		linesToText: linesToText,
		decrypt: decrypt,
		decode: decode
	};
})();
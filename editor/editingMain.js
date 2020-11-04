(() => {
	function run() {
		if (document.readyState != 'complete') {
			return setTimeout(run, 100);
		}

		const textarea = document.querySelector('textarea');
		const highlights = document.querySelector('.highlights');
		const lang = document.querySelector('#lang');
		const suggestionsArea = document.getElementById('suggestionsArea');
		const line = document.getElementById('line');
		const col = document.getElementById('col');
		const helpBtn = document.getElementById('helpBtn');
		const helpMenu = document.getElementById('help');

		let helpActive = false;

		function tryInputChanged() {
			if (typeof window.inputChanged == 'function') {
				window.inputChanged();
			}
		}

		function selectedLang() {
			return lang.querySelector('.selectedOption');
		}

		function setValue(val) {
			textarea.value = val;

			tryInputChanged();
		}

		function toggleHelp() {
			helpActive = !helpActive;

			if (helpActive) {
				helpBtn.className = 'selectedInput';
				helpMenu.style.display = 'block';
			}
			else {
				helpBtn.className = '';
				helpMenu.style.display = 'none';
			}

			window.onresize();
		}

		helpBtn.onclick = toggleHelp;

		function goToPosition() {
			goTo(line.value, col.value);
			window.HOTKEYS_DISABLED = false;
		}

		line.onchange = goToPosition;
		col.onchange = goToPosition;

		function setInputText(lineNo, colNo) {
			lineNo = '' + lineNo;
			colNo = '' + colNo;

			function main(input, text) {
				input.value = text;
				input.style.width = text.length + 'em';
				input.onclick = () => {
					input.focus();
					input.select();
					window.HOTKEYS_DISABLED = true;
				};
			}

			main(line, lineNo);
			main(col, colNo);
		}

		let updateLineColVisual;
		function tryToUpdateLineColVisual() {
			if (typeof updateLineColVisual == 'function') {
				updateLineColVisual();
			}
		}

		setInputText(1, 1);
		goToPosition();

		function goTo(ln, col) {
			ln = parseInt(ln);
			col = parseInt(col);

			const isBadLn = isNaN(ln);
			const isBadCol = isNaN(col);

			if (isBadLn) {
				ln = 1;
			}
			if (isBadCol) {
				col = 1;
			}

			col--;// prevents off by one

			let i = 0;
			let targetLineIndex;
			let lineNo = 1;
			let endOfLine;

			for (; i < textarea.value.length; i++) {
				const c = textarea.value[i];

				if (c == '\n') {
					lineNo++;
				}

				if (lineNo == ln) {
					targetLineIndex = i;
					break;
				}
			}

			if (typeof targetLineIndex != 'number') {
				targetLineIndex = i;
			}

			for (i = targetLineIndex + 1; i < textarea.value.length; i++) {
				const c = textarea.value[i];

				if (c == '\n') {
					endOfLine = i;
					break;
				}
			}

			if (typeof endOfLine != 'number') {
				endOfLine = i;
			}

			if (isBadCol || isBadLn) {
				setInputText(ln, col);
			}

			const pos = (targetLineIndex + col) > endOfLine ? endOfLine : targetLineIndex + col;

			textarea.focus();
			setCaretPos(pos, pos);
		}

		function getCommentType() {
			return window.languages.getActive().comment_singleLine;
		}

		window.onfocus = () => {
			textarea.focus();
		};
		window.onresize = () => {
			let header = document.getElementsByTagName('header');

			header = (header ? header[0].clientHeight : 0);

			const height = 'calc(' + document.body.clientHeight + 'px - ' + (header + helpMenu.clientHeight) + 'px - 2em)';

			highlights.style.height = height;
			textarea.style.height = height;
			textarea.style.marginTop = -textarea.clientHeight + 'px';
		};
		window.focus();
		window.onresize();

		let predictions = [];
		let predictsActive = false;// toggle with alt/
		let predict = 0;// increase with alt. decrease with alt,

		function focusOnPredict() {
			const available = suggestionsArea.children;

			if (!available.length) {
				return;
			}

			const active = available[(predict + available.length) % available.length];

			active.style.border = '2px outset #EE82EE';

			return active;
		}

		function getCaretPos() {
			return {start: textarea.selectionStart, end: textarea.selectionEnd};
		}
		function setCaretPos(start, end) {
			textarea.selectionStart = start;
			textarea.selectionEnd = end;
		}

		textarea.onkeydown = (e) => {
			const active = {
				get: function() {return textarea.value.substring(this.getStartOfLine(), getCaretPos().end)},
				getStartOfLine: function() {
					const originalStart = getCaretPos().start;
					let start = originalStart - 1;
					// console.log(start);

					for (; start > -1; start--) {
						const c = textarea.value[start];

						if (c == '\n') {
							// console.log(start);
							return start;
						}
					}
					// console.log(0);

					return 0;
				},
				getEndOfLine: function() {
					const absoluteEnd = textarea.value.length;

					for (let end = getCaretPos().end; end < absoluteEnd; end++) {
						const c = textarea.value[end];

						if (c == '\n') {
							return end - 1;
						}
					}

					return absoluteEnd;
				},
				getLineNo: function() {
					let index = 0;
					let lineNo = 0;

					for (let i = this.getStartOfLine(); i > -1; i--) {
						const c = textarea.value[i];

						if (c == '\n' || i == 0) {
							lineNo++;
						}

						index++;
					}

					return {lineNo: lineNo, index: index};
				},
				getColNo: function() {
					const lineNo = this.getLineNo();

					return getCaretPos().start - lineNo.index + 1 + (lineNo.lineNo === 1 ? 1 : 0);
				},
				insertAtStartOfLines: function(toInsert) {
					let modified = this.get().replace(/\n/g, '\n' + toInsert);

					if (!this.getStartOfLine()) {
						modified = modified.replace(/^/, toInsert);
					}

					return modified;
				},
				insertAtStartOfLinesIfNotAlreadyInserted: function(toInsert) {
					const prevent = '(?!' + toInsert + ')';
					let modified = this.get().replace(new RegExp('\n' + prevent, 'g'), '\n' + toInsert);

					if (!this.getStartOfLine()) {
						modified = modified.replace(new RegExp('^' + prevent), toInsert);
					}

					return modified;
				},
				removeFromStartOfLines: function(toRemove) {
					return this.get().replace(new RegExp('(^|\\n)' + toRemove, 'g'), (match, p1) => {
						if (p1 == '\n') {
							return '\n';
						}

						return '';
					});
				},
				insertAtEndOfLine: function(toInsert) {
					return this.get() + toInsert;
				},
				getLeadingSpace: function() {
					const match = this.get().match(/^\s+/);
	//							console.log(this.get());
	//							console.log(match);

					if (match) {
						return match[0].replace(/\n+/, '');
					}

					return '';
				},
				getCurrentWord: function() {
					const word = this.get().match(/\w+$/);

					if (word) {
						return word[0];
					}

					return null;
				},
				insertOnCurrentWord: function(replacement) {
					return this.get().replace(/\w+$/, replacement);
				},
				deleteCurrentLines: function() {
					const start = this.getStartOfLine();
					const end = this.getEndOfLine();

					setValue(textarea.value.substring(0, start) + textarea.value.substring(end, textarea.value.length));

					// move to line before deleted
					setCaretPos(start - 1, start - 1);
				},
				duplicateCurrentLines: function() {
					const originalPos = getCaretPos();
					const start = this.getStartOfLine();
					const end = this.getEndOfLine();
					const toCopy = textarea.value.substring(start, end);

					setValue(textarea.value.substring(0, end) + toCopy + textarea.value.substring(end, textarea.value.length));

					// makes more sense to move cursor to relative position of last line
					setCaretPos(originalPos.start + toCopy.length, originalPos.end + toCopy.length);
				},
				applyChanges: function(modified, start) {
					const changed = textarea.value.substring(0, start) + modified;

					setValue(changed + textarea.value.substring(getCaretPos().end, textarea.value.length));

					return changed.length;
				}
			};

			updateLineColVisual = () => {
				if (window.HOTKEYS_DISABLED) {
					return;
				}

				setInputText(active.getLineNo().lineNo, active.getColNo());
			};

			if (window.HOTKEYS_DISABLED) {
				e.preventDefault();
				return;
			}

			listenForHotkeys(e, active);
			makePredictions(e, active);

			tryToUpdateLineColVisual();
		};

		textarea.onkeyup = (e) => {
			tryToUpdateLineColVisual();
		};

		function listenForHotkeys(e, selected) {
			if (e.altKey && e.shiftKey && e.key.toUpperCase() == 'A') {
				// untab pressed
				const start = selected.getStartOfLine();
				const modified = selected.removeFromStartOfLines('\t');
				const end = selected.applyChanges(modified, start);
				// move to last of tab

				setCaretPos(end, end);
			}
			else if (e.altKey && e.key == 'a') {
				// tab pressed
				const start = selected.getStartOfLine();
				const modified = selected.insertAtStartOfLines('\t');
				const end = selected.applyChanges(modified, start);
				// move to last of tab

				setCaretPos(end, end);
			}
			else if (e.altKey && e.key == 'c') {
				// clear all leading space
				const start = selected.getStartOfLine();
				const modified = selected.removeFromStartOfLines('\\s+');
				const end = selected.applyChanges(modified, start);
				// move to start of line

				setCaretPos(end, end);
			}
			else if (e.altKey && e.key == '/') {
				predictsActive = !predictsActive;
				predict = 0;
			}
			else if (e.key == 'Enter' && !e.altKey) {
				// make new line following indentation
				e.preventDefault();

				const start = selected.getStartOfLine();
				const space = '\n' + selected.getLeadingSpace();
				const end = selected.applyChanges(selected.insertAtEndOfLine(space), start);
				// move to end of new line

				setCaretPos(end, end);
			}
			else if (e.altKey && e.key == 'l') {
				// focus language
				selectedLang().click();
			}
			else if (e.ctrlKey && e.shiftKey && (e.key == ':' || e.key == ';')) {
				// uncomment
				const start = selected.getStartOfLine();
				const modified = selected.removeFromStartOfLines(getCommentType());
				const end = selected.applyChanges(modified, start);
				// move to start of line

				setCaretPos(end, end);
			}
			else if (e.ctrlKey && e.key == ';') {
				// comment
				const start = selected.getStartOfLine();
				const modified = selected.insertAtStartOfLinesIfNotAlreadyInserted(getCommentType());
				const end = selected.applyChanges(modified, start);
				// move to start of line

				setCaretPos(end, end);
			}
			else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() == 'D')) {
				// remove line
				selected.deleteCurrentLines();
				e.preventDefault();
			}
			else if (e.ctrlKey && e.key == 'd') {
				// dupe line
				e.preventDefault();
				selected.duplicateCurrentLines();
			}
			else if (e.altKey && e.key == 'r') {
				reformat(textarea);
			}
			else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() == 'G') {
				// goto col
				e.preventDefault();
				col.click();
			}
			else if (e.ctrlKey && e.key == 'g') {
				// goto line
				e.preventDefault();
				line.click();
			}
			else if (e.altKey && e.key == 'h') {
				// toggle help
				e.preventDefault();
				toggleHelp();
			}
			// TODO undo redo
		}

		function makePredictions(e, selected) {
			suggestionsArea.innerHTML = '';

			if (!predictsActive) {
				return;
			}

			const currentWord = selected.getCurrentWord();

			if (currentWord == null) {
				return;
			}

			predictions = [];

			window.languages.getActive().keywords().forEach((word) => {
				if (word.startsWith(currentWord)) {
					predictions.push(word);
				}
			});

			predictions = (predictWords(currentWord, textarea) || []).concat(predictions);

			function insertWord(word) {
				const start = selected.getStartOfLine();

				const end = selected.applyChanges(selected.insertOnCurrentWord(word), start);
				predict = 0;
				suggestionsArea.innerHTML = '';
				setCaretPos(end, end);
				tryToUpdateLineColVisual();
			}

			displaySuggested(predictions, insertWord);

			if (e.altKey && e.key == '.') {
				predict = (predict + 1) % predictions.length;
			}
			else if (e.altKey && e.key == ',') {
				predict = (predict - 1) % predictions.length;
			}
			else if (e.altKey && e.key == 'Enter') {
				const active = focusOnPredict();

				if (active) {
					active.click();
				}
			}

			focusOnPredict();
		}

		function displaySuggested(suggested, insertWord) {
			suggestionsArea.innerHTML = '';

			for (let i = 0; i < suggested.length; i++) {
				const suggestion = suggested[i];

				suggested[i] = null;
				display(suggestion);
			}

			function display(suggestion) {
				const btn = document.createElement('input');

				btn.type = 'button';
				btn.value = suggestion;
				btn.onclick = () => {
					insertWord(suggestion);
				};
				suggestionsArea.appendChild(btn);
			}
		}

		function predictWords(startStr, textarea) {
			const words = textarea.value.match(/\b\w+\b/g);

			if (!words) {
				return;
			}

			let result = {};

			for (let i = words.length - 1; i > -1; i--) {
				const word = words.pop();

				if (word.startsWith(startStr)) {
					if (!result[word]) {
						result[word] = 0;
					}

					result[word]++;
				}
			}

			// largest to smallest
			result = Object.keys(result).sort((a, b) => {
				return result[b] - result[a];
			});

			// let's limit to 10 suggestions
			const max = 10;

			if (result.length > max) {
				result.splice(max, result.length - max);
			}

			return result;
		}

		function reformat(textarea) {
			// remove trailing space, only 1 empty line allowed
			setValue(textarea.value.replace(/(?!\n)\s+$/gm, '').replace(/\n\n\n+/g, '\n\n'));
		}
	}

	run();
})();
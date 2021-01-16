(() => {
	// looked at https://codersblock.com/blog/highlight-text-inside-a-textarea/ and https://www.w3schools.com/howto/tryit.asp?filename=tryhow_syntax_highlight for ideas

	function run() {
		if (document.readyState != 'complete' || typeof $ != 'function') {
			return setTimeout(run, 100);
		}

		const txtarea = document.querySelector('textarea');
		const $textarea = $(txtarea);
		const highlights = document.querySelector('.highlights');
		const $highlights = $(highlights);

		$textarea.on({
			'input': handleInput,
	    	'scroll': handleScroll
		});
		window.inputChanged = handleInput;

		function handleInput() {
			console.log('input triggered')
			highlights.innerHTML = '';
			applyHighlights(txtarea.value);
		}

		function handleScroll() {
			$highlights.scrollTop($textarea.scrollTop());
		}

		let otherLangData;
		function setupHighlightContainingLangs(activeLang) {
			if (typeof activeLang != 'object' || !activeLang.contains) {
				otherLangData = null;
			}
			else {
				otherLangData = activeLang.contains;
				console.log(otherLangData);
			}
		}

		const TARGET = highlights;// this is a bug
		let tracker = '';
		function addToTracker(type, node) {
			if (!otherLangData) {
				tracker = '';
				return;
			}

			tracker += type ? type + ' ' : '';

			/*
			for (let lang in otherLangData) {
				const data = otherLangData[lang];

				if (tracker.endsWith(data.match)) {
					const numNodesNeeded = data.match.match(/\s+/g).length;

					const TARGET_CHILDREN = TARGET.children;
					let targetChildren = [];
					for (let i = TARGET_CHILDREN.length - 1, n = numNodesNeeded - 1; i > -1; i--) {
						const child = TARGET_CHILDREN[i];
						
						if (child.className) {
							targetChildren[n] = child;
							n--;

							if (n == -1) {
								break;
							}
						}
					}

					let numMatches = 0;

					for (let i = 0; i < numNodesNeeded; i++) {
						if (typeof data.exact[i] == 'string') {
							const trackerItem = targetChildren[i].innerText;

							if (trackerItem.match(data.exact[i])) {
								numMatches++;
							}
						}
					}

					if (numMatches == data.exact.length) {
						const currentNode = TARGET.lastElementChild;
						const startStringNode = document.createElement('span');
						const endStringNode = document.createElement('span');
						const newLangNode = document.createElement('span');
						const toMarkup = currentNode.innerText.substring(1, currentNode.innerText.length - 1);

						startStringNode.innerHTML = currentNode.innerText[0];
						newLangNode.className = lang;
						endStringNode.innerHTML = currentNode.innerText[currentNode.innerText.length - 1];

						currentNode.innerHTML = '';
						currentNode.appendChild(startStringNode);
						currentNode.appendChild(newLangNode);
						currentNode.appendChild(endStringNode);

						TARGET = newLangNode;
						applyHighlights(toMarkup, lang);
						TARGET = highlights;// this is a bug, not necessarily appropriate
					}
				}
			}
			*/
		}
		function add(node) {
			// prevents html getting rendered accidentally
			TARGET.append(node);

			addToTracker(node.className.toUpperCase(), node);
		}

		function getBestMatch(matches) {
			return matches.sort((a, b) => {
				return b.found - a.found || a.startIndex - b.startIndex || b.endIndex - a.endIndex;
				// found then first found then by match length (bigger is better - /* prioritized over / and * and returns over return)
			})[0];
		}
		function displayBestMatch(bestMatch, txt, i) {
			const textLen = txt.length;

			if (bestMatch.found) {
				const isWord = bestMatch.type == 'word';
				const textNode = document.createTextNode(txt.substring(bestMatch.startIndex, bestMatch.endIndex));
				const span = document.createElement('span');

				span.className = bestMatch.type;
				span.appendChild(textNode);

				add(span);

				i = bestMatch.endIndex;
			}
			else {
				const span = document.createElement('span');

				span.className = 'error';
				span.innerText = txt.substring(i, textLen);

				add(span);

				i = textLen;
			}

			return i;
		}

		function applyHighlights(text, langName) {
			const textLen = text.length;
			
			if (!window.languages[langName]) {
				langName = window.languages.getActive().name;
			}

			const activeLang = window.languages[langName];

			setupHighlightContainingLangs(activeLang);

			function extractComment(i, commentType, commentStart, commentEnd) {
				const charsLeft = textLen - i;
				const neededChars = commentStart.length;
				let result = {found: false, startIndex: i, endIndex: textLen, type: 'comment'};

				if (charsLeft >= neededChars) {
					result.found = text.substring(i, i + neededChars) == commentStart;

					if (result.found) {
						let end = text.indexOf(commentEnd, i + neededChars);

						if (end == -1) {
							end = textLen;
						}
						else if (commentType == 'commentML') {
							end += commentEnd.length;
						}

						result.endIndex = end;
					}
				}

				return result;
			}

			function extractCommentSL(i) {
				return extractComment(i, 'commentSL', activeLang.comment_singleLine, '\n');
			}

			function extractCommentML(i) {
				return extractComment(i, 'commentML', activeLang.comment_multiLineStart, activeLang.comment_multiLineEnd);
			}

			function extractString(txt, i, string, isMultiline) {
				const charsLeft = txt.length - i;
				const neededChars = string.length;

				let result = {found: false, startIndex: i, endIndex: txt.length, type: 'string'};

				if (neededChars > charsLeft) {
					return result;
				}

				if (txt.substring(i, i + neededChars) != string) {
					return result;
				}

				function find(start) {
					const end = txt.indexOf(string, start + 1);

					if (end == -1) {
						result.found = true;
					}
					else if (end < txt.length) {
						let escapePos = end - string.length;

						if (escapePos > -1) {
							if (txt.substring(escapePos, escapePos + string.length) == activeLang.escapeChar) {
								const escapeIsEscaped = (escapePos--, escapePos > -1 ? txt[escapePos] == activeLang.escapeChar : false);

								if (!escapeIsEscaped) {
									return find(end + 1);
								}
							}
						}

						result.found = true;
						result.endIndex = end + string.length;// includes the end of string mark
					}

					if (!isMultiline) {
						if (txt.substring(result.startIndex, result.endIndex).match(/\n/)) {
							result.found = false;
							result.endIndex = txt.length;
						}
					}

					return result;
				}

				return find(i);
			}

			function extractWord(i, searchWord) {
				const charsLeft = textLen - i;
				let result = {found: false, startIndex: i, endIndex: textLen, type: 'word'};

				if (!text[i].match(activeLang.identifierRegex)) {
					return result;
				}

				if (searchWord) {
					const neededChars = searchWord.length;

					if (neededChars > charsLeft) {
						return result;
					}

					const word = text.substring(i, i + neededChars);

					result.found = searchWord == word;

					if (result.found) {
						result.endIndex = i + neededChars;
					}
				}
				else {
					const word = text.substring(i, textLen).match(activeLang.identifierRegex);

					result.found = !!word;

					if (result.found) {
						result.endIndex = i + word[0].length;
					}
				}

				return result;
			}

			function extractKeywords(i) {
				let results = [];

				if (!text[i].match(activeLang.identifierRegex)) {
					return {found: false, startIndex: i, endIndex: textLen, type: 'keyword'};
				}

				activeLang.keywords().forEach((word) => {
					let result = extractWord(i, word);

					result.type = 'keyword';

					results.push(result);
				});

				results.sort((a, b) => {
					return b.found - a.found || a.startIndex - b.startIndex || b.endIndex - a.endIndex;
					// found then first found then by match length (bigger is better - /* prioritized over / and * and returns over return)
				});

				return results[0];
			}

			function extractNumber(i) {
				let result = {found: false, startIndex: i, endIndex: textLen, type: 'number'};

				result.found = !!text[i].match(activeLang.numberRegex);

				if (result.found) {
					const number = text.substring(i, textLen).match(activeLang.numberRegex);

					result.endIndex = i + number[0].length;
				}

				return result;
			}

			function getSymbol(i) {
				let result = {found: false, startIndex: i, endIndex: textLen, type: 'symbol'};

				result.found = !!text[i].match(activeLang.symbolsRegex);

				if (result.found) {
					result.endIndex = i + 1;
				}

				return result;
			}

			function extractSpecial(i) {
				let result = {found: false, startIndex: i, endIndex: textLen, type: 'special'};
				
				result.found = text.substring(i, textLen).match(activeLang.special);
				
				if (result.found) {
					const match = result.found[0];

					if (text[i] == match[0]) {
						result.startIndex = text.indexOf(match, i);// because entire remainder of string is searched
						result.endIndex = i + match.length;
					}
					else {
						result.found = false;
					}
				}

				result.found = !!result.found;

				return result;
			}

			function extractProgrammingLang(i) {
				const c = text[i];
				let foundData = [];

				if (c == activeLang.comment_singleLine[0]) {
					foundData.push(extractCommentSL(i));
				}
				if (c == activeLang.comment_multiLineStart[0]) {
					foundData.push(extractCommentML(i));
				}
				if (c == activeLang.string_1[0]) {
					foundData.push(extractString(text, i, activeLang.string_1));
				}
				if (c == activeLang.string_2[0]) {
					foundData.push(extractString(text, i, activeLang.string_2));
				}
				if (c == activeLang.stringML_1[0]) {
					foundData.push(extractString(text, i, activeLang.stringML_1, true));
				}
				if (c == activeLang.stringML_2[0]) {
					foundData.push(extractString(text, i, activeLang.stringML_2, true));
				}

				foundData.push(extractKeywords(i));

				foundData.push(extractWord(i));

				foundData.push(extractNumber(i));

				foundData.push(getSymbol(i));
				
				foundData.push(extractSpecial(i));

				return displayBestMatch(getBestMatch(foundData), text, i);
			}
			
			function insideTag(tagname, start, end) {
				// css or js
				if (typeof activeLang.contains != 'object' || !activeLang.contains) {
					activeLang.contains = {};
				}

				let foundOtherLang = false;

				for (let lang in activeLang.contains) {
					if (tagname.toLowerCase() == activeLang.contains[lang]) {
						foundOtherLang = true;
						applyHighlights(text.substring(start, end), lang);
					}
				}

				return foundOtherLang;
			}

			let tag;
			function extractXml(i) {
				const c = text[i];
				const symbols = ['<', '=', '>', '/'];
				const prevC = (() => {
					let j = i - 1;

					for (; j > -1; j--) {
						if (!text[j].match(/\s/)) {
							break;
						}
					}

					return text[j] || '';
				})();
				function cTo(offset) {
					if (i + offset > textLen) {
						return text.substring(i, textLen);
					}

					return text.substring(i, i + offset);
				}

				const isASymbol = symbols.includes(c);
				const prevIsASymbol = symbols.includes(prevC);
				let end = textLen;
				let type;
				let doingOtherLang = false;

				if (cTo(activeLang.comment_multiLineStart.length) == activeLang.comment_multiLineStart) {
					type = 'comment';
					end = text.indexOf(activeLang.comment_multiLineEnd, i + activeLang.comment_multiLineStart.length);

					if (end == -1) {
						end = textLen;
					}
					else {
						end += activeLang.comment_multiLineEnd.length;
					}
				}
				else if (isASymbol && prevIsASymbol && !((prevC == '<' && c == '/') || (prevC == '>' && c == '<') || (prevC == '/' && (c == '<' || c == '>')))) {
					type = 'error';
				}
				else if (isASymbol) {
					type = 'symbol';
					end = i + 1;
				}
				else {
					if (prevIsASymbol && (prevC == '<' || prevC == '/')) {
						type = 'xmlTagName';
						end = (() => {
							const match = text.substring(i, textLen).match(/\s|>/);

							return match ? text.indexOf(match[0], i) : textLen;
						})();
						tag = text.substring(i, end);
					}
					else if (prevIsASymbol && prevC == '=' && (c == '"' || c == "'")) {
						type = 'xmlAttribVal';
						const index = text.indexOf(c, i + 1);
						end = index == - 1 ? textLen : index + 1;
					}
					else if (prevIsASymbol && prevC == '>') {
						// is inside a tag, could be another tag or character data
						type = 'word';
						let closeTagIndex = text.indexOf('</' + tag + '>', i);
						// might be in a js string for example, difficult to see if it is. at orst style or script closed early causing incorrect highlighting
						
						const indexes = [closeTagIndex, text.indexOf('<', i)].filter(item => item > -1).sort((a, b) => {
							return b - a;
						});
						end = !indexes.length ? textLen : indexes[0];

						doingOtherLang = insideTag(tag, i, end);
					}
					else if (!prevIsASymbol) {
						type = 'xmlAttribName';
						end = (() => {
							const match = text.substring(i, textLen).match(/\s|=|>/);
							const index = match ? text.indexOf(match[0], i) : textLen;

							return index;
						})();
					}
					else {
						type = 'error';
					}
				}

				if (!doingOtherLang) {
					const span = document.createElement('span');

					span.innerText = text.substring(i, end);

					if (type != 'word') {
						span.className = type;
					}

					add(span);
				}

				return end;
			}

			let expectingOpening = true;
			let closuresExpected = 0;
			// has to be "
			function extractJson(i) {
				return i + 1;
			}

			let i = 0;
			let prevI = -1;

			while (i < textLen && i > -1) {
				const c = text[i];

				if (c.match(/\s/)) {
					const span = document.createElement('span');

					span.innerText = c;
					add(span);
					i++;
				}
				else {
					if (activeLang.xmlLike) {
						i = extractXml(i)
					}
					else if (activeLang.jsonLike) {
						i = extractJson(i);
					}
					else {
						i = extractProgrammingLang(i);
					}
				}

				if (i <= prevI) {
					throw 'infinate loop';
				}

				prevI = i;
			}
		}
	}
	
	run();
})();
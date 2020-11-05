(() => {
	// looked at https://codersblock.com/blog/highlight-text-inside-a-textarea/ and https://www.w3schools.com/howto/tryit.asp?filename=tryhow_syntax_highlight for ideas

	function run() {
		if (document.readyState != 'complete' || typeof $ != 'function') {
			return setTimeout(run, 100);
		}

		const $textarea = $(document.getElementsByTagName('textarea')[0]);
		const $highlights = $(document.querySelector('.highlights'));

		$textarea.on({
			'input': handleInput,
	    	'scroll': handleScroll
		});

		function handleInput() {
			$highlights.html('');
			applyHighlights($textarea.val());
		}

		window.inputChanged = handleInput;

		function handleScroll() {
			$highlights.scrollTop($textarea.scrollTop());
		}

		function applyHighlights(text) {
			const textLen = text.length;
			const activeLang = window.languages.getActive();

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

			function extractString(i, string, isMultiline) {
				const charsLeft = textLen - i;
				const neededChars = string.length;

				let result = {found: false, startIndex: i, endIndex: textLen, type: 'string'};

				if (neededChars > charsLeft) {
					return result;
				}

				if (text.substring(i, i + neededChars) != string) {
					return result;
				}

				function find(start) {
					const end = text.indexOf(string, start + 1);

					if (end == -1) {
						result.found = true;
					}
					else if (end < textLen) {
						let escapePos = end - string.length;

						if (escapePos > -1) {
							if (text.substring(escapePos, escapePos + string.length) == activeLang.escapeChar) {
								const escapeIsEscaped = (escapePos--, escapePos > -1 ? text[escapePos] == activeLang.escapeChar : false);

								if (!escapeIsEscaped) {
									return find(end + 1);
								}
							}
						}

						result.found = true;
						result.endIndex = end + string.length;// includes the end of string mark
					}

					if (!isMultiline) {
						if (text.substring(result.startIndex, result.endIndex).match(/\n/)) {
							result.found = false;
							result.endIndex = textLen;
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
						result.endIndex = i + match.length;
					}
					else {
						result.found = false;
					}
				}

				result.found = !!result.found;

				return result;
			}

			let i = 0;

			function add(node) {
				// prevents html getting rendered accidently
				$highlights.append(node);
			}

			while (i < textLen) {
				const c = text[i];

				if (c.match(/\s/)) {
					const span = document.createElement('span');

					span.innerText = c;
					add(span);
					i++;
				}
				else {
					let foundData = [];

					if (c == activeLang.comment_singleLine[0]) {
						foundData.push(extractCommentSL(i));
					}
					if (c == activeLang.comment_multiLineStart[0]) {
						foundData.push(extractCommentML(i));
					}
					if (c == activeLang.string_1[0]) {
						foundData.push(extractString(i, activeLang.string_1));
					}
					if (c == activeLang.string_2[0]) {
						foundData.push(extractString(i, activeLang.string_2));
					}
					if (c == activeLang.stringML_1[0]) {
						foundData.push(extractString(i, activeLang.stringML_1, true));
					}
					if (c == activeLang.stringML_2[0]) {
						foundData.push(extractString(i, activeLang.stringML_2, true));
					}

					foundData.push(extractKeywords(i));

					foundData.push(extractWord(i));

					foundData.push(extractNumber(i));

					foundData.push(getSymbol(i));
					
					foundData.push(extractSpecial(i));

					foundData.sort((a, b) => {
						return b.found - a.found || a.startIndex - b.startIndex || b.endIndex - a.endIndex;
						// found then first found then by match length (bigger is better - /* prioritized over / and * and returns over return)
					});

					const bestMatch = foundData[0];

					foundData = null;

					if (bestMatch.found) {
						const isWord = bestMatch.type == 'word';
						const textNode = document.createTextNode(text.substring(bestMatch.startIndex, bestMatch.endIndex));
						let span;

						if (!isWord) {
							span = document.createElement('span');
							span.className = bestMatch.type;
							span.appendChild(textNode);
						}

						add(span ? span : textNode);

						i = bestMatch.endIndex;
					}
					else {
						const span = document.createElement('span');

						span.className = 'error';
						span.innerText = text.substring(i, textLen);

						add(span);

						i = textLen;
					}
				}
			}
		}
	}
	
	run();
})();
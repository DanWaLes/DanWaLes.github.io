/* jshint esnext: false */
/* jshint esversion: 9 */
/* jshint browser: true */
/* jshint devel: true */

// run from browser on a warzone page

(async () => {
	async function main() {
		const rawStory = await readThread();
		const editedStory = editStory(rawStory);
		const story = doParagraphs(editedStory);
		download(rawStory.trim(), 'raw_story_' + new Date().toJSON(), 'txt');
		download(story.trim(), 'story_' + new Date().toJSON(), 'txt');
	}

	async function getPage(url) {
		return await fetch(url).then((responce) => {
			return responce.text();
		});
	}

	async function readThread() {
		const parser = new DOMParser();
		const url = 'https://www.warzone.com/Forum/410884';
		const postsPerPage = 20;
		let offset = 0;
		let totalPosts;
		let story = '';

		console.log('offset = ' + offset);
		while (true) {
			console.log('totalPosts = ' + totalPosts);

			if (totalPosts && (offset > totalPosts)) {
				// read all pages
				console.log('read all pages');
				break;
			}

			const doc = parser.parseFromString(await getPage(url + (offset ? '?Offset=' + offset : '')), 'text/html');
			totalPosts = (() => {
				const tds = doc.querySelectorAll("table td[align='right']");

				return parseInt(tds[tds.length - 1].firstChild.textContent.match(/Posts \d+ - \d+ of (\d+)/)[1]);
			})();

			story += (' ' + readThreadPage(doc));
			offset += postsPerPage;
			console.log('offset = ' + offset);
		}

		return story;
	}

	function readThreadPage(doc) {
		const postTbls = doc.querySelectorAll("[id^='PostTbl_']");
		let words = [];

		for (let postTbl of postTbls) {
			if (postTbl.style.display != 'none' && postTbl.id.match(/PostTbl_\d+$/)) {
				const word = readPost(postTbl.getElementsByClassName('DiscussionPostDiv')[0]);

				if (word) {
					words.push(word);
				}
			}
		}

		return words.join(' ');
	}

	function readPost(post) {
		// escape HTML entities

		const textarea = document.createElement('textarea');
		textarea.innerHTML = post.innerHTML
			.replace(/<br>/g, '\n')// convert br tag to newline
			.replace(/<(\/)?([bi])>/g, '[$1$2]')// convert bold and italic to wz format
			.replace(/<[^\/]+\/\s*>/, '')// remove self closing tags
			.replace(/<[^>]+>[^<]+<\/[^>]+>/, '')// remove tags
			.replace(/(\n+|\t+| +)/g, '$1')// remove excessive spaces
			.replace(/(\s)\([^)]+?\)/g, '')// remove comments
			.trim();

		return textarea.value
			.replace(/(‘{2}|’{2})/g, '"')
			.replace(/[‘’]/g, "'")
			.replace(/[“”]/g, '"')
			.replace(/…/g, '...')
			.replace(/¡/g, '!')
			.replace(/¿/g, '?')
			.replace(/¸/g, ',')
			.replace(/÷/g, '/')
			.replace(/×/g, '*')
			.match(/^[ -\/:-@[-`{-~\]]*[\p{L}\p{N}!-\/:-@\[`{-~¡-¿]+[ -\/:-@[-`{-~\]]*$/u);
	}

	function editStory(rawStory) {
		return rawStory
			.replace(/\(\s*\)/g, '')// remove any random empty brackets
			.replace(/\s{2,}/g, ' ')
			.replace(/[.]{3,}/g, '…')// triple dot to ellipsis
			.replace(/(…)(\S)/g, '$1 $2')// space after ellipsis
			.replace(/\s+([.,?!'])/g, '$1')// remove leading space on .,?!'
			.replace(/([.!?]\s?["]?.)/g, (_, p1) => {
				// capitalize letters after .!?
				return p1.toUpperCase();
			})
			.replace(/(\p{N})\s?([<>+\-*\/=^]+)\s?(\p{N})/gu, '$1 $2 $3')// force spaces between numbers and maths operators
			.replace(/(\p{L})\s?-\s?(\p{L})/gu, '$1-$2')// hyphenate words
			.replace(/([.,?!;:])(\p{L})/gu, '$1 $2')// space after .,?!;:
			.replace(/(\s")\s/g, '$1')// remove leading space when in "
			.replace(/\s("[.,;:!?])/g, '$1')// remove trailing space when in "
			.replace(/war(zone|light)(\.\s?com|\.\s?net|)/gi, (_, p1, p2) => {
				// capitalise warzone/warlight correctly
				return 'War' + p1[0].toUpperCase() + p1.substring(1, p1.length).toLowerCase() + ((p2 ? p2 : '').toLowerCase().replace(/\s/g, ''));
			})
			.replace(/made!\s?Raffle/, 'made !raffle')// this is what's intended in the story
			.replace(/("Ouchie\.")( Meanwhile)/, '$1.$2')
			.replace(/(stinks) (")(said)/, '$1$2 $3')
			.replace(/(No)( really advised Chagatai )(purge)d/, '$1one$2to $3')
			.replace(/(Suddenly, I exclaim: )(This is flame!")/, '$1"$2')
			.replace(/(got nice)\.( For all)/, (_, p1, p2) => {
				return p1 + p2.toLowerCase();
			})
			.replace(/, a(nd Waffles are)-ing/, '. A$1')
			.replace(/(Grovertron-5000). R(ule)s( the battleships )(sailed)/, '$1. $1 r$2d$3that $4')
			.replace(/"(Return)!"\s(chain)/, '$1-$2')
			.replace(/(exclaim: "This is flame!)/, '$1".')// somehow this adds a space at the end
			.replace(/(shall eat Dots")( Ironman)/, '$1.$2')
			.replace(/ Ranted "f\*\*\*\./, '')// doesnt make sense and the quote is never closed correctly
			.replace(/( Richard)+/g, '$1')// to spammy
	}

	function doParagraphs(editedStory) {
		// is \. in paragraph (including in quotes)
		const paragraphs = [
			9, 13, 8, 4, 3,
			7, 7, 11, 4, 13,
			20, 29, 5, 13, 7,
			10, 5, 13, 9, 5,
			5, 3, [5, '!'], 4, 9,
			[1, '!'], [9, '!'], 5, 8, 8,
			54, 2, 9, [10, '??'], 3,
			5, 5, [26, '!'], 7, 2,
			3, 3, 7, 5, 13,
			13, 7, 14, 8, 5,
			5, 2, 2, [0, '?'], 2,
			4, [6, '???????'], [3, '!'], 4,[1, '?'],
			null
		];

		let story = '';
		let cCount = 0;

		for (let p of paragraphs) {
			let notDone = true;
			let dotCount = 0;
			const pIsNumber = typeof p == 'number';

			if (pIsNumber || Array.isArray(p)) {
				while (notDone && editedStory[cCount]) {
					story += editedStory[cCount];

					if (editedStory[cCount] == '.') {
						dotCount++;
					}

					cCount++;

					if (dotCount == (pIsNumber ? p : p[0])) {
						if (!pIsNumber) {
							let otherCount = 0;

							while (editedStory[cCount]) {
								story += editedStory[cCount];

								if (editedStory[cCount] == p[1][otherCount]) {
									otherCount++;
								}

								cCount++;

								if (otherCount == p[1].length) {
									break;
								}
							}
						}

						story += '\n\n';
						cCount++;// skip space after mark
						notDone = false;
					}
				}
			}
			else {
				story += editedStory.substring(cCount, editedStory.length);
				break;
			}		
		}

		return story.replace(/(^|\n\n)\s+/g, '$1');
	}

	function download(contents, filename, type) {
		const types = {
			"txt": "text/plain",
			"html": "text/html",
			"json": "application/json"
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

	await main();
})();
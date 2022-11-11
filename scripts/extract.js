/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

(function() {
	async function extractClanMembers(clanWindow, onMemberFound) {
		if (!(clanWindow instanceof Window)) {
			if (clanWindow instanceof HTMLIFrameElement) {
				clanWindow = clanWindow.contentWindow;
			}
			else {
				throw new Error('clanWindow must be an instanceof Window');
			}
		}

		if (typeof onMemberFound != 'function') {
			throw new Error('onMemberFound(data) must be a function. data is {clanId: int, name: string, title: string, number: int}');
		}

		class ClanNotFoundError extends Error {
			constructor(funcName) {
				super('clan not found');
				this.name = 'ClanNotFoundError';
			}
		}

		async function getTotalClanMembers() {
			if (!clanWindow.location.href.match(/^https:\/\/www\.warzone\.com\/Clans\/\?ID=\d+/i)) {
				throw new ClanNotFoundError();
			}

			const re = /(\d+) members?/;
			const label = await waitForElementToExist('[id ^= "ujs_NumMembersLabel"] span', clanWindow.document);
			const match = label.innerText.match(re);

			if (match) {
				return parseInt(match[1]);
			}

			await sleep(100);
			return await getTotalClanMembers();
		}

		async function clickNext() {
			// console.log('init clickNext');
			const pagerBtns = await waitForElementsToExist("[id ^= 'ujs_MainContainer'] div[id ^= 'ujs_Button'].ujsGameObject.ujsBtn.ujsImg", clanWindow.document);
			// console.table('pagerBtns', pagerBtns);
			const nextBtn = pagerBtns[pagerBtns.length - 1];
			// console.table('nextBtn', nextBtn);
			async function retry() {
				// console.log('retry called');
				await sleep(100);
				await clickNext();
			}

			if (nextBtn.innerText.trim() != "Next >>") {
				await retry();
			}

			const mainBtn = nextBtn.querySelector("a[id $= 'btn']");
			// console.table('mainBtn', mainBtn);

			if (mainBtn) {
				mainBtn.click();
			}
			else {
				await retry();
			}
		}

		let first;
		async function waitForLoaded() {
			const firstMember = (await waitForElementToExist("[id ^= 'ujs_ClanSceneMember']", clanWindow.document)).id;

			if (!firstMember || firstMember == first) {
				await sleep(100);
				await waitForLoaded();
			}
		}

		async function getPlayerNumber(player) {
			const popupBtn = player.firstElementChild.querySelector("a[id $= 'btn']");
			const popupFinder = "[id ^= 'ujs_GenericContainer'] [id ^= 'ujs_MiniProfile']";

			popupBtn.click();

			async function checkIfNumberLoaded() {
				const num = (await waitForElementToExist(popupFinder + " [id ^= 'ujs_Content'] [id ^= 'ujs_ViewFullProfileBtn'] a[id $= 'exLink']", clanWindow.document)).href.match(/(\d+)/);
				
				if (num) {
					return parseInt(num[1]);
				}
				else {
					await sleep(100);
					return await checkIfNumberLoaded();
				}
			}

			const number = await checkIfNumberLoaded();
			const popup = clanWindow.document.querySelector(popupFinder);

			popup.remove();
			return number;
		}

		try {
			function errorDetected(err) {
				throw err;
			}

			const maxMembersPerPage = 40;
			const totalClanMembers = await getTotalClanMembers().catch((err) => {
				errorDetected(err);
			});
			const clanId = parseInt(clanWindow.location.href.match(/\d+/)[0]);
			const membersOnLastPg = (totalClanMembers % maxMembersPerPage) || maxMembersPerPage;
			const totalPages = Math.ceil(totalClanMembers / maxMembersPerPage);

			/*console.table('totalClanMembers', totalClanMembers);
			console.table('membersOnLastPg', membersOnLastPg);
			console.table('totalPages', totalPages);*/

			const pageLoaded = async function(i) {
				await sleep(100);

				const members = await waitForElementsToExist("[id ^= 'ujs_ClanSceneMember'].ujsGameObject.ujsImg", clanWindow.document);
				let check = maxMembersPerPage;

				if (i == totalPages) {
					check = membersOnLastPg;
				}

				/*console.table('members.length', members.length);
				console.table('check', check);*/

				if (members.length == check) {
					for (let i = 0; i < members.length; i++) {
						const member = members[i];

						if (!i) {
							first = member.id;
						}

						const player = member.querySelector("[id ^= 'ujs_member']");
						let data = {clanId: clanId, name: player.children[2].innerText.trim(), title: member.lastElementChild.innerText.trim()};

						data.number = await getPlayerNumber(player);

						// console.table('data', data);
						await onMemberFound(data, totalClanMembers);
					}
				}
				else {
					await pageLoaded(i);
				}
			};

			const start = 1;
			await pageLoaded(start);

			for (let i = start + 1; i < totalPages + start; i++) {
				await clickNext();
				await waitForLoaded();
				await pageLoaded(i);
			}
		}
		catch(err) {
			throw err;
		}
	}

	async function extractPlayerDetails(playerNumber, detailsToGet) {
		const profile = await fetchText("https://www.warzone.com/Profile?p=" + playerNumber);
		const get = {
			name: () => {
				return profile.match(/<title>(.+) - Warzone - Better than Hasbro's RISK&#xAE; game - Play Online Free<\/title>/)[1];
			},
			isMember: () => {
				return !!profile.match(/<img src="https:\/\/warzonecdn\.com\/Images\/MemberIcon\.png/);
			},
			country: () => {
				const match = profile.match(/<img src="https:\/\/warzonecdn\.com\/Images\/Flags\/([A-Z]+)\.jpg" title="Plays from ([\w\s]+)/);

				if (match) {
					return {code: match[1], country: match[2]};
				}

				return null;
			},
			level: () => {
				return parseInt(profile.match(/<big><b>Level (\d+)<\/b><\/big>/)[1]);
			},
			clan: () => {
				const match = profile.match(/<a href="\/Clans\/\?ID=(\d+)">\s+<img style="vertical-align: middle" src="https:\/\/warzonecdn\.com\/s3\/Data\/Clans\/\d+\/Icon\/(.+)" border="0" \/>(.+)\s+<\/a>/);
				
				if (match) {
					return {id: parseInt(match[1]), iconFileName: match[2], name: match[3]};
				}

				return null;
			},
			points: () => {
				return profile.match(/>Points earned in last 30 days:<\/font>\s*((?:(?:\d+|\,))+)\s*/)[1];
			},
			joinedSince: () => {
				return new Date(profile.match(/<font class="text-muted">Joined Warzone:<\/font> (\d+\/\d+\/\d+)/)[1]);
			},
			memberSince: function() {
				if (this.isMember()) {
					return new Date(profile.match(/<font class="text-muted">Member since<\/font> (\d+\/\d+\/\d+)/)[1]);
				}

				return null;
			},
			totalGames: () => {
				return parseInt(profile.match(/<font class="text-muted">Played in<\/font> (\d+) multi-player games/)[1]);
			},
			lastSeen: () => {
				return profile.match(/Last seen <\/font\>\s+(.+)\s+</)[1].trim();
			},
			boot: () => {
				const match = profile.match(/<font class="text-muted">(?:Booted (\d+) times* \((\d+(?:\.\d+)*)% of their last 100\))|(Never booted from a game\.)<\/font>/);

				if (match) {
					if (match[3]) {
						return {total: 0, lastHundredPercent: 0};
					}

					return {total: parseInt(match[1]), lastHundredPercent: Number(match[2])};
				}

				return null;
			}
		};

		class FuncNotFoundError extends Error {
			constructor(funcName) {
				super('funcName ' + funcName + ' not recognized');
				this.name = 'FuncNotFoundError';
			}
		}

		class PlayerNotFoundError extends Error {
			constructor(funcName) {
				super('player' + playerNumber + ' not found');
				this.playerNumber = playerNumber;
				this.name = 'PlayerNotFoundError';
			}
		}

		function accountExists() {
			return !profile.match(/<title>Warzone - Better than Hasbro's RISK&#xAE; game - Play Online Free<\/title>/);
		}

		try {
			const ret = {};
			const exists = accountExists();
			
			if (!exists) {
				throw new PlayerNotFoundError();
			}

			for (let funcName of detailsToGet) {
				if (get[funcName]) {
					ret[funcName] = get[funcName]();
				}
				else {
					throw new FuncNotFoundError(funcName);
				}
			}

			return ret;
		}
		catch(err) {
			if (err instanceof FuncNotFoundError || err instanceof PlayerNotFoundError) {
				throw err;
			}
			else {
				throw new Error('unexpected profile page layout change');
			}
		}
	}

	/**
	 * @returns Array of player links
	*/
	async function extractOwnBlocklist(onPlayerFound) {
		const bl = await fetchText("https://www.warzone.com/ManageBlockList");
		const linksRe = /<a href="(Profile\?p=\d{5,})">/ig;
		const linkRe = new RegExp(linksRe.source, "i");
		const blocklist = bl.match(linksRe) || [];

		// convert to full link
		for (let i = 0; i < blocklist.length; i++) {
			const link = "https://www.warzone.com/" + blocklist[i].match(linkRe)[1];

			blocklist[i] = link;
		}

		return blocklist;
	}

	// from this point dependencies for extract
	function sleep(duration) {
		const main = new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, duration);
		});

		return main;
	}
	async function fetchText(url, delay, fetchOptions) {
		if (typeof delay != "number") {
			delay = 1000;
		}

		await sleep(delay);

		// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
		// if there was a connection when it started but later goes after 10 secs, try again
		// but if there was none in the first place, waits until it comes back

		return await fetchWithTimeout(url, 10000, fetchOptions)
			.then(response => {
				if (response.ok) {
					return response.text();
				}
				else {
					throw new Error("unable to load url " + url);
				}
			})
			.then(data => {
				return data;
			})
			.catch(err => {
				if (err.message == "timeout") {
					return fetchText(url, delay * 2, fetchOptions);
				}

				throw err;
			});
	}
	function fetchWithTimeout(url, timeout, fetchOptions) {
		// https://stackoverflow.com/questions/46946380/fetch-api-request-timeout#answer-49857905
		if (timeout < 1 || typeof timeout != "number") {
			return;
		}

		return Promise.race([
			fetch(url, fetchOptions),
			new Promise((_, reject) => {
				setTimeout(() => reject(new Error("timeout")), timeout);
			})
		]);
	}

	// from this point copied over from userscripts_common.js
	function waitForElementsToExist(queryString, queryFrom) {
		// based on https://stackoverflow.com/questions/24928846/get-return-value-from-settimeout
		const main = new Promise((resolve, reject) => {
			const interval = setInterval(() => {
				const elements = queryFrom.querySelectorAll(queryString);

				if (elements.length) {
					clearInterval(interval);
					resolve(elements);
				}
			}, 1000);
		});

		return main;
	}
	function waitForElementToExist(queryString, queryFrom) {
		return waitForElementsToExist(queryString, queryFrom)
			.then((elements) => {
				return elements[0];
			});
	}

	function deepFreeze(object) {
		// Retrieve the property names defined on object
		const propNames = Object.getOwnPropertyNames(object);

		// Freeze properties before freezing self

		for (let name of propNames) {
			let value = object[name];

			if (value && typeof value === "object") {
				deepFreeze(value);
			}
		}

		return Object.freeze(object);
	}

	// share
	const extract = {
		clanMembers: extractClanMembers,
		playerDetails: extractPlayerDetails,
		ownBlocklist: extractOwnBlocklist
	};

	window.EXTRACT = deepFreeze(extract);
})();

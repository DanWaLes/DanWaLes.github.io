/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

async function runApp(config) {
	async function getGames(us) {
		stdout('getting games from ' + us);

		const games = await fetch(`https://lichess.org/api/games/user/${us}?moves=False&since=${config.since}&to=${config.to}`, {
			method: 'GET',
			headers: {
				'Accept': 'application/x-ndjson',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + config.apiToken,
			},
			stream: true
		}).then((response) => response.text());

		return ndjsonToJSON(games);
	}

	async function getOpponents(us) {
		const games = await getGames(us);
		const opponents = {
			list: {},
			length: 0
		};

		function getPlayer(game, color) {
			const user = game.players[color].user;
	
			if (user) {
				return user.name;
			}

			// else is stockfish
		}
		function addOpponent(opponent) {
			if (!opponent) return;

			if (opponent == us) {
				return;
			}

			if (!opponents.list[opponent]) {
				opponents.list[opponent] = true;
				opponents.length++;
			}
		}

		for (let game of games) {
			addOpponent(getPlayer(game, 'white'));
			addOpponent(getPlayer(game, 'black'));
		}

		return opponents;
	}

	function findCommon(allOpponents) {
		stdout('finding common opponents');

		const everyone = {};
		const common = [];
		const numOpponents = allOpponents.length;

		for (let i = 1; i < numOpponents; i++) {
			const ownOpponents = allOpponents[i].list;

			for (let opponent in allOpponents[0].list) {
				if (ownOpponents[opponent]) {
					if (!everyone[opponent]) {
						everyone[opponent] = 1;
					}

					everyone[opponent]++;

					if (everyone[opponent] == numOpponents) {
						common.push(opponent);
					}
				}
			}
		}

		return common;
	}

	function generateShareURL() {
		return location.origin + location.pathname + '?config=' + encodeURIComponent(JSON.stringify(config));
	}

	const allOpponents = [];

	for (let name of config.toCheck) {
		allOpponents.push(await getOpponents(name));
	}

	// sort all opponents by fewest to make findCommon faster
	allOpponents.sort((a, b) => {
		return a.length - b.length;
	});

	const common = findCommon(allOpponents);

	stdout('common opponents = ' + common.reduce((a, b) => a + ', ' + b));
	stdout('this search can be shared using ' + generateShareURL());

	return common;
}
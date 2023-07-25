(() => {
	async function fetchJson(url, defaultJson) {
		try {
			return await (await fetch(url)).json();
		}
		catch(err) {
			// can't fetch unless on a website
			return defaultJson;
		}
	}

	async function Season(seasonNo, players) {
		const season = await fetchJson('json/seasons/' + seasonNo + '.json', {template: {}, teams: {}, games: []});

		const div = document.createElement('div');
		div.className = 'season';

		const seasonHeading = document.createElement('h1');
		seasonHeading.innerText = 'Season ' + seasonNo;
		div.appendChild(seasonHeading);

		const template = document.createElement('p');
		template.innerHTML = `Template: <a href="https://www.warzone.com/MultiPlayer?TemplateID=${season.template.id}">${season.template.name}</a>`;
		div.appendChild(template);

		const nav = document.createElement('nav');
		const ul = document.createElement('ul');
		const seasonDetails = [document.createElement('li'), document.createElement('li')];

		const main = document.createElement('main');

		seasonDetails[0].innerText = 'Standings';
		seasonDetails[1].innerText = 'Games';

		for (let i = 0; i < seasonDetails.length; i++) {
			const element = seasonDetails[i];

			element.onclick = (e) => {
				const activeSeasonDetails = document.getElementsByClassName('activeSeasonDetails');
				for (let j = activeSeasonDetails.length - 1; j > -1; j--) {
					activeSeasonDetails[j].className = '';
				}

				e.target.className = 'activeSeasonDetails';
				main.children[i].className = 'activeSeasonDetails';
			};
			ul.appendChild(element);
		}

		nav.appendChild(ul);
		div.appendChild(nav);

		main.appendChild(makeStandings(season));
		main.appendChild(makeGamesByTeamList(season));

		div.appendChild(main);

		return div;
	}

	function makeStandings(season) {
		const standings = calcStandings(season);
		const standingsDiv = document.createElement('div');
		const standingsTbl = document.createElement('table');
		const thead = document.createElement('thead');
		thead.innerHTML = `<tr>
			<th>Team</th>
			<th>Players</th>
			<th>Rank</th>
			<th>Wins</th>
			<th>Losses</th>
			<th>In-progress</th>
		</tr>`;
		const tbody = document.createElement('tbody');
		for (let t of standings) {
			const tr = document.createElement('tr');

			const name = document.createElement('td');
			name.innerText = t.team;
			tr.appendChild(name);

			const team = season.teams[t.team];
			const p = document.createElement('td');
			for (let i = 0; i < team.length; i++) {
				const player = team[i];
				const a = document.createElement('a');
				a.href = 'https://www.warzone.com/Profile?p=' + player;
				a.innerText = players[player];
				p.appendChild(a);

				if (team[i + 1]) {
					p.appendChild(document.createTextNode(' '));
				}
			}
			tr.appendChild(p);

			const keys = ['rank', 'wins', 'losses', 'inProgress'];
			for (let key of keys) {
				const td = document.createElement('td');
				td.innerText = t[key];
				tr.appendChild(td);
			}

			tbody.appendChild(tr);
		}
		standingsTbl.appendChild(thead);
		standingsTbl.appendChild(tbody);

		standingsDiv.appendChild(standingsTbl);

		return standingsDiv;
	}

	function calcStandings(season) {
		let scores = [];
		let teams = {};

		for (let team in season.teams) {
			teams[team] = scores.length;
			scores.push({team: team, wins: 0, losses: 0, inProgress: 0});
		}

		for (let game of season.games) {
			if (game.winner) {
				scores[teams[game.winner]].wins++;

				for (let team of game.teams) {
					if (game.winner != team) {
						scores[teams[team]].losses++;
					}
				}
			}
			else {
				for (let team of game.teams) {
					scores[teams[team]].inProgress++;
				}
			}
		}

		scores = scores.sort((a, b) => b.wins - a.wins);

		let rank = 1;
		for (let i = 0; i < scores.length; i++) {
			scores[i].rank = rank;

			if (scores[i + 1] && scores[i].wins < scores[i + 1].wins) {
				rank++;
			}
		}

		return scores;
	}

	function makeGamesByTeamList(season) {
		const games = indexGamesByTeams(season);
		const gamesDiv = document.createElement('div');

		gamesDiv.appendChild(document.createTextNode('Show games by '));
		const teamsList = document.createElement('select');
		for (let team in games) {
			const t = document.createElement('option');
			t.value = team;
			t.innerText = team;
			teamsList.appendChild(t);
		}
		gamesDiv.appendChild(teamsList);

		const gamesTbl = document.createElement('table');
		const thead = document.createElement('thead');
		thead.innerHTML = `<tr>
			<th>Team 1<th>
			<th>Team 2<th>
			<th>Link</th>
			<th>Outcome</th>
		</tr>`;
		const tbody = document.createElement('tbody');
		gamesTbl.appendChild(thead);
		gamesTbl.appendChild(tbody);
		gamesDiv.appendChild(gamesTbl);
		teamsList.onchange = () => {
			tbody.innerHTML = '';

			for (let game of gamesByTeams[teamsList.value]) {
				const tr = document.createElement('tr');

				for (let team of game.teams) {
					const td = document.createElement('td');
					td.innerText = team;
					tr.appendChild(td);
				}

				const gameLink = document.createElement('td');
				gameLink.innerHTML = `<a href="https://www.warzone.com/MultiPlayer?GameID=${game.gameid}"></a>`;
				tr.appendChild(gameLink);

				const outcome = document.createElement('td');
				if (game.winner) {
					outcome.innerText = (game.winner == teamsList.value ? 'won': 'lost');
				}
				else {
					outcome.innerText = 'In-progress';
				}
				tr.appendChild(outcome);

				gamesTbl.appendChild(tr);
			}
		};

		return gamesDiv;
	}

	function indexGamesByTeams(season) {
		let games = {};

		for (let game of season.games) {
			for (let team of game.teams) {
				if (!games[team]) {
					games[team] = [];
				}

				games[team].push(game);
			}
		}

		return games;
	}

	async function run() {
		if (document.readyState != 'complete') {
			return;
		}

		const end = await (async () => {
			let numSeasons;
			try {
				parseInt(await (await fetch('json/numSeasons.txt')).text());
			}
			catch(err) {
				numSeasons = 1;
			}

			return numSeasons + 1;
		})();
		const players = await fetchJson('json/players.json', {});
		const nav = document.getElementsByTagName('nav')[0].firstElementChild;
		const main = document.getElementsByTagName('main')[0];
		
		function seasonClicked(e, i) {
			const currentActiveSeason = document.getElementsByClassName('activeSeason');

			for (let a = currentActiveSeason.length - 1; a > -1; a--) {
				const element = currentActiveSeason[a];

				element.className = element.className.replace(/(^| )activeSeason( |$)/, '');
			}

			e.target.className = 'activeSeason';
			const seasons = document.getElementsByClassName('season');
			const activeSeason = seasons[i - 1];
			activeSeason.className += ' activeSeason';

			// view standings of season
			activeSeason.querySelector('nav ul li').click();
		}
		console.log('end = ' + end);

		for (let i = 1; i < end; i++) {
			const li = document.createElement('li');
			li.innerHTML = 'Season ' + i;
			li.onclick = (e) => {
				seasonClicked(e, i);
			};
			nav.appendChild(li);

			main.appendChild(await Season(i));
		}

		// select latest season
		nav.children[nav.children.length - 1].click();
	}

	document.onreadystatechange = run;
})();
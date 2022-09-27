(() => {
	const exe = {
		settings: {
			overrideScrabbleLetterLimits: false,
			blank1: 'N',
			blank2: 'N',
			options: {
				tileSize: 74,
				wordBonusSize: 16,
				letterSize: 28,
				gapBetweenTiles: 3,
				letterFont: 'Courier New',
				specialBonuses: {
					enabled: true,
					bonusSize: 49,
					letterFont: 'Courier New',
					letterSize: 20
				}
			}
		},
		placements: [
			{tt: 'v', x: 0, y: 0},
			{tt: 'i', x: 0, y: 1},
			{tt: 'l', x: 0, y: 2},
			{tt: 'l', x: 0, y: 3},
			{tt: 'a', x: 0, y: 4},
			{tt: 'i', x: 0, y: 5},
			{tt: 'n', x: 0, y: 6},

			{tt: 'i', x: 1, y: 3},
			{tt: 'b', x: 2, y: 3},

			{tt: 'o', x: 2, y: 2},
			{tt: 'j', x: 2, y: 1},

			{tt: 'a', x: 3, y: 1},
			{tt: 'y', x: 4, y: 1},

			{tt: 'o', x: 1, y: 6},
			{tt: 'u', x: 2, y: 6},
			{tt: 'n', x: 3, y: 6}
		]
	};

	window.createSVG.fromJSONString(JSON.stringify(exe));
})();
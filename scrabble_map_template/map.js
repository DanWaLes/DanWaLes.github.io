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
			{tt: 'c', x: 4, y: 0},
			{tt: 'h', x: 7, y: 0},

			{tt: 'i', x: 0, y: 1},
			{tt: 'j', x: 2, y: 1},
			{tt: 'a', x: 3, y: 1},
			{tt: 'y', x: 4, y: 1},
			{tt: 'd', x: 6, y: 1},
			{tt: 'e', x: 7, y: 1},
			{tt: 'e', x: 8, y: 1},
			{tt: 'm', x: 9, y: 1},
			{tt: 'e', x: 10, y: 1},
			{tt: 'd', x: 11, y: 1},

			{tt: 'l', x: 0, y: 2},
			{tt: 'o', x: 2, y: 2},
			{tt: 'b', x: 4, y: 2},
			{tt: 'a', x: 7, y: 2},
			{tt: 'm', x: 8, y: 2},
			{tt: 'i', x: 11, y: 2},

			{tt: 'l', x: 0, y: 3},
			{tt: 'i', x: 1, y: 3},
			{tt: 'b', x: 2, y: 3},
			{tt: 'e', x: 4, y: 3},
			{tt: 'd', x: 7, y: 3},
			{tt: 'f', x: 11, y: 3},
			{tt: 'o', x: 12, y: 3},
			{tt: 'r', x: 13, y: 3},

			{tt: 'a', x: 0, y: 4},
			{tt: 'p', x: 3, y: 4},
			{tt: 'r', x: 4, y: 4},
			{tt: 'o', x: 5, y: 4},
			{tt: 'p', x: 6, y: 4},
			{tt: 'h', x: 7, y: 4},
			{tt: 'e', x: 8, y: 4},
			{tt: 't', x: 9, y: 4},
			{tt: 'f', x: 12, y: 4},
			{tt: 'a', x: 13, y: 4},
			{tt: 'n', x: 14, y: 4},

			{tt: 'i', x: 0, y: 5},
			{tt: 'e', x: 3, y: 5},
			{tt: 'u', x: 7, y: 5},
			{tt: 'z', x: 13, y: 5},
			{tt: 'a', x: 14, y: 5},

			{tt: 'n', x: 0, y: 6},
			{tt: 'o', x: 1, y: 6},
			{tt: 'u', x: 2, y: 6},
			{tt: 'n', x: 3, y: 6},
			{tt: 'n', x: 7, y: 6},
			{tt: 'o', x: 13, y: 6},
			{tt: 'y', x: 14, y: 6},

			{tt: 'g', x: 3, y: 7},
			{tt: 't', x: 7, y: 7},
			{tt: 'w', x: 8, y: 7},
			{tt: 'e', x: 9, y: 7},
			{tt: 'a', x: 10, y: 7},
			{tt: 'k', x: 11, y: 7},
			{tt: 'e', x: 12, y: 7},
			{tt: 'r', x: 13, y: 7},
			{tt: 's', x: 14, y: 7},

			{tt: 'g', x: 2, y: 8},
			{tt: 'i', x: 3, y: 8},
			{tt: 'g', x: 4, y: 8},
			{tt: 'e', x: 7, y: 8},
			{tt: 'v', x: 10, y: 8},

			{tt: 'u', x: 3, y: 9},
			{tt: 'r', x: 7, y: 9},
			{tt: 'q', x: 9, y: 9},
			{tt: 'i', x: 10, y: 9},
			{tt: 'n', x: 13, y: 9},

			{tt: 'n', x: 3, y: 10},
			{tt: 's', x: 7, y: 10},
			{tt: 'a', x: 10, y: 10},
			{tt: 'o', x: 13, y: 10},

			{tt: 'w', x: 1, y: 11},
			{tt: 'a', x: 2, y: 11},
			{tt: 's', x: 3, y: 11},
			{tt: 't', x: 4, y: 11},
			{tt: 'e', x: 5, y: 11},
			{tt: 'd', x: 6, y: 11},
			{tt: 't', x: 10, y: 11},
			{tt: 'i', x: 13, y: 11},

			{tt: 'a', x: 1, y: 12},
			{tt: 'i', x: 10, y: 12},
			{tt: 's', x: 13, y: 12},

			{tt: 'e', x: 0, y: 13},
			{tt: 'x', x: 1, y: 13},
			{tt: 'i', x: 2, y: 13},
			{tt: 't', x: 3, y: 13},
			{tt: 'c', x: 5, y: 13},
			{tt: 'o', x: 6, y: 13},
			{tt: 'n', x: 7, y: 13},
			{tt: 't', x: 8, y: 13},
			{tt: 'r', x: 9, y: 13},
			{tt: 'o', x: 10, y: 13},
			{tt: 'l', x: 11, y: 13},
			{tt: 'l', x: 12, y: 13},
			{tt: 'e', x: 13, y: 13},
			{tt: 'r', x: 14, y: 13},

			{tt: 'u', x: 7, y: 14},
			{tt: 'n', x: 10, y: 14}
		]
	};

	window.createSVG.fromJSONString(JSON.stringify(exe));
})();
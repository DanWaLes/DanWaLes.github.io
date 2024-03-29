/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

(function() {
	if (!(window.utils && typeof window.utils == 'object')) {
		window.utils = {};
	}

	window.utils.tableSorter = Sorter;

	function sortTableOptionsAreValid(options) {
		/**
		 * @param options {colNo: Int, dir: Dir, table: HTMLTableElement}
		*/

		if (!options || typeof options != 'object') {
			options = {};
		}

		if (!(options.table instanceof HTMLTableElement)) {
			throw 'table in sortTable options must be a HTMLTableElement';
		}

		const table = options.table.getElementsByTagName('tbody')[0] || options.table;// use table body or entire table, whichever is more relevant
		const maxCols = table.getElementsByTagName('tr')[0].children.length;// if breaks here its a badly made table

		const colNo = parseInt(options.colNo);
		if (isNaN(colNo) || colNo < 0 || colNo > maxCols) {
			throw `colNo in sortTable options must be number-like and be at least 0 and within the range of the table header, ${maxCols}`;
		}

		const dirs = ['asc', 'desc'];
		if (!dirs.includes(options.dir)) {
			throw `dir in sortTable options must be ${dirs.join(' or ')}`;
		}

		return true;
	}

	// https://www.w3schools.com/howto/howto_js_sort_table.asp was too slow, browser unresponsive
	// this is something i put together and works nicely :)
	function sortTable(options) {
		if (!sortTableOptionsAreValid(options)) {
			return;
		}

		const table = options.table;

		const thead = table.tHead;
		const theadTr = thead ? thead.rows : null;
		const header = theadTr ? theadTr[theadTr.length - 1] : null || table.getElementsByTagName('tr')[0];

		if (!header) {
			throw 'table doesn't have a header';
		}

		const tableBody = table.tBodies[0] || table;// use table body or entire table, whichever is more relevant
		let rows = tableBody.rows;
		let offset = 0;

		if (rows[0] == header) {
			let newRows = {length: 0};

			for (let i = 1; i < rows.length; i++) {
				newRows[i - 1] = rows[i];
				newRows.length++;
			}

			rows = newRows;
			offset = 1;
		}

		const numRows = rows.length;
		const dir = options.dir;
		const colNo = options.colNo;

		const sorter = header.children[colNo].dataset.sorter;
		const isSortingByNumber = sorter == 'number';
		const isSortingByDate = sorter == 'date';
		const isSortingByText = !isSortingByDate && !isSortingByNumber;

		rows.toArray = function() {
			const array = [];

			for (let i = 0; i < rows.length; i++) {
				array.push(rows[i]);
			}

			return array;
		};

		const sorted = rows.toArray().sort((a, b) => {
			let sortItemA = a.children[colNo];
			if (sortItemA.dataset.sortVal) {
				sortItemA = sortItemA.dataset.sortVal;
			}
			else {
				sortItemA = sortItemA.innerText;
			}

			let sortItemB = b.children[colNo];
			if (sortItemB.dataset.sortVal) {
				sortItemB = sortItemB.dataset.sortVal;
			}
			else {
				sortItemB = sortItemB.innerText;
			}

			if (isSortingByDate) {
				sortItemA = new Date(sortItemA).getTime();
				sortItemB = new Date(sortItemB).getTime();
			}
			else if (isSortingByNumber) {
				sortItemA = Number(sortItemA);
				sortItemB = Number(sortItemB);
			}

			if (dir == 'desc') {
				if (isSortingByText) {
					// + means concat otherwise
					// https://www.techonthenet.com/js/string_localecompare.php
					return -(sortItemA.localeCompare(sortItemB, document.documentElement.lang || navigator.language, {caseFirst: 'upper'}));
				}

				return sortItemA + sortItemB;
			}

			if (isSortingByText) {
				return sortItemA.localeCompare(sortItemB, document.documentElement.lang || navigator.language, {caseFirst: 'upper'});
			}

			return sortItemA - sortItemB;
		});

		for (let i = 0; i < rows.length; i++) {
			const toMove = sorted[i];

			toMove.parentNode.insertBefore(toMove, toMove.parentNode.children[i + offset]);
		}
	}

	/**
	 * Makes a new sorter, allowing the table to become sortable and making it clear that table header items can be sorted
	 *
	 * @param table HTMLTableElement
	 * @param columns an object in number-like: preferedSort format
	 */
	function Sorter(table, columns, preventRun, updatePreventRun) {
		this.validSorts = ['asc', 'desc'];

		if (!(table instanceof HTMLTableElement)) {
			throw 'table must be a HTMLTableElement';
		}

		const thead = table.tHead;
		const theadTr = thead ? thead.rows : null;
		const header = theadTr ? theadTr[theadTr.length - 1] : null || table.getElementsByTagName('tr')[0];

		if (!header) {
			throw 'table does not have a header';
		}

		if (!columns) {
			throw `columns must be an object of colNo: preferedSort, where preferedSort is ${this.validSorts.join(' or ')})`;
		}

		this.table = table;
		this.header = header;
		this.columns = {};
		this.isRunning = false;
		this.lastSortedCol = undefined;
		this.preventRun = preventRun;
		this.updatePreventRun = updatePreventRun;

		for (let colNo in columns) {
			colNo = parseInt(colNo);
			const preferedSort = columns[colNo];

			if (!isFinite(colNo)) {
				throw 'colNo must be number-like';
			}
			else if (this.columns[colNo]) {
				throw 'no duplicated colNos allowed';
			}

			if (!this.validSorts.includes(preferedSort)) {
				throw `preferedSort must be ${this.validSorts.join(' or ')}, received ${preferedSort}`;
			}

			if (colNo < 0 || colNo > this.header.children.length - 1) {
				throw `cannot apply sort to a column that doesn't exist on the table`;
			}

			const theCol = colNo;

			this.columns[colNo] = {
				initialDir: this.validSorts.indexOf(preferedSort),
				currentDir: -1,
				sort: () => this.sortMain(theCol)
			};

			this.addSortEvent(colNo);
		}
	}
	Sorter.prototype.sortMain = function(colNo) {
		// console.log('init sortMain with ' + colNo);

		const col = this.columns[colNo];

		// console.table('col', col);

		if (typeof this.preventRun == 'function' && typeof this.updatePreventRun == 'function') {
			// for if this.isRunning isn't enough
			if (this.preventRun()) {
				return;
			}
		}

		const that = this;
		function updatePreventRun() {
			if (typeof that.preventRun == 'function' && typeof that.updatePreventRun == 'function') {
				// console.log('init updatePreventRun');
				that.updatePreventRun();
			}
		}

		if (this.isRunning || !col) {
			console.warn('cannot do sort as already sorting or col does not exist');
			updatePreventRun();
			return;
		}

		this.isRunning = true;

		// initial or opposite of initial if already sorted
		// console.log('col.currentDir = ' + col.currentDir);
		if (col.currentDir == -1) {
			col.currentDir = col.initialDir;
		}
		else {
			if (col.currentDir == col.initialDir && this.lastSortedCol == colNo) {
				col.currentDir = col.currentDir ? 0 : 1;
			}
			else {
				col.currentDir = col.initialDir;
			}
		}

		// console.log('col.currentDir = ' + col.currentDir);
		const options = {table: this.table, dir: this.validSorts[col.currentDir], colNo: colNo};

		// console.table('options', options);
		sortTable(options);

		this.lastSortedCol = colNo;
		this.isRunning = false;
		updatePreventRun();
	};
	Sorter.prototype.addSortEvent = function(colNo) {
		const header = this.header;
		const element = header.children[colNo];
		const sorter = this;

		element.onclick = function() {
			sorter.columns[colNo].sort();
		};
		element.style.cursor = 'pointer';
		element.title = 'Sort';
	};
	Sorter.prototype.setSort = function(colNo, sort) {
		colNo = parseInt(colNo);
		const max = this.header.childElementCount - 1;

		if (!isFinite(colNo) || colNo < 0 || colNo > max) {
			throw `colNo ${colNo} doesn't exist. must be between 0 and ${max}`;
		}

		this.header.children[colNo].dataset.sorter = sort;
	};
})();
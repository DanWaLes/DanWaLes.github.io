/* jshint esnext: false */
/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint devel: true */

(function() {
	// https://en.wikipedia.org/wiki/Insertion_sort
	function insertionSort(array, dir, ORIGIN) {
		if (!Array.isArray(array.originals)) {
			array.originals = [];
		}

		const isAsc = dir == "asc";
		const arrayLen = array.length;

		array.originals[ORIGIN] = array[arrayLen - 1];// to keep references intact

		let i = 1;
		while (i < arrayLen) {
			let x = array[i];
			let j = i - 1;

			if (isAsc) {
				while (j >= 0 && array[j] > x) {
					array[j + 1] = array[j];
					j--;
				}
			}
			else {
				while (j >= 0 && array[j] < x) {
					array[j + 1] = array[j];
					j--;
				}
			}

			array[j + 1] = x;
			i++;
		}

		return array;
	}

	function sortTableOptionsAreValid(options) {
		/**
		 * @param options {colNo: Int, dir: Dir, table: HTMLTableElement}
		*/

		if (!options || typeof options != "object") {
			options = {};
		}

		if (!(options.table instanceof HTMLTableElement)) {
			throw "table in sortTable options must be a HTMLTableElement";
		}

		const table = options.table.getElementsByTagName("tbody")[0] || options.table;// use table body or entire table, whichever is more relevant
		const maxCols = table.getElementsByTagName("tr")[0].children.length;// if breaks here its a badly made table

		const colNo = parseInt(options.colNo);
		if (isNaN(colNo) || colNo < 0 || colNo > maxCols) {
			throw `colNo in sortTable options must be number-like and be at least 0 and within the range of the table header, ${maxCols}`;
		}

		const dirs = ["asc", "desc"];
		if (!dirs.includes(options.dir)) {
			throw `dir in sortTable options must be ${dirs.join(" or ")}`;
		}

		return true;
	}

	// https://www.w3schools.com/howto/howto_js_sort_table.asp was too slow, browser unresponsive
	// this is something i put together and works nicely :)
	function sortTable(options) {
		if (!sortTableOptionsAreValid(options)) {
			return;
		}
		// console.table("options = ", options);

		const table = options.table;

		const tableBody = table.tBodies[0] || table;// use table body or entire table, whichever is more relevant
		const rows = tableBody.rows;
		const numRows = rows.length;
		const dir = options.dir;
		const colNo = options.colNo;

		const thead = table.tHead;
		const theadTr = thead ? thead.rows : null;
		const header = theadTr ? theadTr[theadTr.length - 1] : null || table.getElementsByTagName("tr")[0];

		if (!header) {
			throw "table doesn't have a header";
		}

		const sorter = header.children[colNo].dataset.sorter;
		const isSortingByNumber = sorter == "number";
		const isSortingByDate = sorter == "date";

		let sortData = [];
		const offset = theadTr ? 0 : 1;

		for (let i = offset; i < numRows; i++) {
			// get all the sort data - dont modify the html yet as more total dom operations are required. dom = slow
			const row = rows[i].children;

			let item = {};
			const rowItem = row[colNo];

			if (rowItem.dataset.sortVal === undefined) {
				item = rowItem.innerText.trim();
			}
			else {
				item = rowItem.dataset.sortVal;
			}

			if (isSortingByNumber) {
				item = Number(item);
			}
			else if (isSortingByDate) {
				item = new Date(item).getTime();
			}
			// sortVal wasnt initialised before sort, made everything undefined
			// if (!item[i]) {
				// throw `item ${i} is falsey\nrowItem.sortVal = ${rowItem.sortVal}\nrowItem.innerHTML = ${rowItem.innerHTML}`;
			// }

			sortData.push(item);
			sortData = insertionSort(sortData, dir, i);
			break;// lets only do one and see what happens
		}

		console.table("sortData = ", sortData);
		console.table("sortData.originals = ", sortData.originals);

		for (let i = 0; i < sortData.length; i++) {
			// place the sorted items into the table
			// the actual sort is correct but the visual is not right

			const itemToFind = sortData[i];
			const foundIndex = sortData.originals.indexOf(itemToFind);

			console.log(`${itemToFind} is set at index ${i}. was originally at ${foundIndex}`);
			const toMove = rows[foundIndex];

			// toMove.setAttribute("data-pos", i);// doesn't update visually
			console.log("toMove num = " + foundIndex);
			console.log(toMove);
			toMove.parentNode.appendChild(toMove);

			// rows[i + offset]rows[foundIndex].parentNode.insertBefore(rows[foundIndex], rows[i + offset].parentNode);
			// can now delete item at found index, free up memory
			// sortData.splice(i, 1);
			// sortData.originals.splice(foundIndex, 1);
		}

		/*
		for (let i = numRows - 1; i > (-1 + offset); i--) {
			// place the sorted items into the table
			const itemToFind = sortData[i];// may not be there due to offset used when getting sort data
			const foundIndex = sortData.originals.indexOf(itemToFind);

			if (foundIndex > -1) {
				rows[foundIndex].parentNode.insertBefore(rows[foundIndex], rows[i + 1 - offset]);
				// can now delete item at found index, free up memory
				sortData.splice(i, 1);
				sortData.originals.splice(foundIndex, 1);
			}
		}
		*/
	}

	/**
	 * Makes a nw sorter, allowing the table to become sortable and making it clear that table header items can be sorted
	 *
	 * @param table HTMLTableElement
	 * @param columns an object in number-like: preferedSort format
	 */
	function Sorter(table, columns) {
		this.validSorts = ["asc", "desc"];

		if (!(table instanceof HTMLTableElement)) {
			throw "table must be a HTMLTableElement";
		}

		const thead = table.tHead;
		const theadTr = thead ? thead.rows : null;
		const header = theadTr ? theadTr[theadTr.length - 1] : null || table.getElementsByTagName("tr")[0];

		if (!header) {
			throw "table doesn't have a header";
		}

		if (!columns) {
			throw `columns must be an object of colNo: preferedSort, where preferedSort is ${this.validSorts.join(" or ")})`;
		}

		this.table = table;
		this.header = header;
		this.columns = {};
		this.isRunning = false;
		this.lastSortedCol = undefined;

		for (let colNo in columns) {
			colNo = parseInt(colNo);
			const preferedSort = columns[colNo];

			if (!isFinite(colNo)) {
				throw "colNo must be number-like";
			}
			else if (this.columns[colNo]) {
				throw "no duplicated colNos allowed";
			}

			if (!this.validSorts.includes(preferedSort)) {
				throw `preferedSort must be ${this.validSorts.join(" or ")}, received ${preferedSort}`;
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
		// console.log("init sortMain with " + colNo);

		const col = this.columns[colNo];

		// console.table("col", col);

		if (this.isRunning || !col) {
			console.warn("cannot do sort as already sorting or col doesn't exist");
			return;
		}

		this.isRunning = true;

		// initial or opposite of initial if already sorted
		// console.log("col.currentDir = " + col.currentDir);
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

		// console.log("col.currentDir = " + col.currentDir);
		const options = {table: this.table, dir: this.validSorts[col.currentDir], colNo: colNo};

		// console.table("options", options);
		sortTable(options);

		this.lastSortedCol = colNo;
		this.isRunning = false;
	};
	Sorter.prototype.addSortEvent = function(colNo) {
		const header = this.header;
		const element = header.children[colNo];
		const sorter = this;

		element.onclick = function() {
			sorter.columns[colNo].sort();
		};
		element.style.cursor = "pointer";
		element.title = "Sort";
	};
	Sorter.prototype.setSort = function(colNo, sort) {
		colNo = parseInt(colNo);
		const max = this.header.childElementCount - 1;

		if (!isFinite(colNo) || colNo < 0 || colNo > max) {
			throw `colNo ${colNo} doesn't exist. must be between 0 and ${max}`;
		}

		this.header.children[colNo].dataset.sorter = sort;
	};

	window.getSorter = function() {
		return Sorter;
	};
})();
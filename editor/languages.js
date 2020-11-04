(function() {
	const keywords = {
		generic: ['break','case','catch','continue','default','do','else','finally','for','if','import','in','return','static','switch','throw','try','while','true','false','null'],
		classes: ['abstract','class','extends','implements','interface','super','this','instanceof','new'],
		accessMod: ['private','protected','public','requires'],
		typed: ['boolean','char','double','enum','float','int','long','short','void'],
		opNames: ['and','or','not'],
		cFam: function() {
			return this.generic.concat(this.typed).concat(['auto','const','extern','inline','register','restrict','signed','sizeof','struct','typedef','union','unsigned','volatile']);
		},
		cClass: ['class','new','template','this'],
		'js': function() {
			return this.generic.concat(this.classes).concat(['await','delete','const','let','function','with','of','typeof','undefined']);
		},
		'py': function() {
			return this.generic.concat(this.opNames).concat(['as','assert','class','def','del','elif','except','False','from','global','import','is','lambda','None','nonlocal','pass','raise','True','with','yield']);
		},
		'java': function() {
			return this.generic.concat(this.classes).concat(this.accessMod).concat(this.typed).concat(['package','exports','byte','final','throws']);
		},
		'c': function() {
			return this.cFam();
		},
		'c++': function() {
			return this.cFam().concat(this.opNames).concat(this.cClass).concat(['alignas','alignof','and_eq','asm','atomic_cancel','atomic_commit','atomic_noexcept','bitand','bitor','bool','char8_t','char16_t','char32_t','compl','concept','consteval','constexpr','constinit','const_cast','co_await','co_return','co_yield','decltype','dynamic_cast','explicit','export','extern','friend','mutable','namespace','noexcept','not_eq','nullptr','operator','or_eq','reflexpr','reinterpret_cast','static_assert','static_cast','synchronized','thread_local','typeid','typename','using','virtual','wchar_t','xor','xor_eq']);
		},
		'sql': function() {
			return ['ADD','ADD CONSTRAINT','ALTER','ALTER COLUMN','ALTER TABLE','ALL','AND','ANY','AS','ASC','BACKUP DATABASE','BETWEEN','CASE','CHECK','COLUMN','CONSTRAINT','CREATE','CREATE DATABASE','CREATE INDEX','CREATE OR REPLACE VIEW','CREATE TABLE','CREATE PROCEDURE','CREATE UNIQUE INDEX','CREATE VIEW','DATABASE','DEFAULT','DELETE','DESC','DISTINCT','DROP','DROP COLUMN','DROP CONSTRAINT','DROP DATABASE','DROP DEFAULT','DROP INDEX','DROP TABLE','DROP VIEW','EXEC','EXISTS','FOREIGN KEY','FROM','FULL OUTER JOIN','GROUP BY','HAVING','IN','INDEX','INNER JOIN','INSERT INTO','INSERT INTO SELECT','IS NULL','IS NOT NULL','JOIN','LEFT JOIN','LIKE','LIMIT','NOT','NOT NULL','OR','ORDER BY','OUTER JOIN','PRIMARY KEY','PROCEDURE','RIGHT JOIN','ROWNUM','SELECT','SELECT DISTINCT','SELECT INTO','SELECT TOP','SET','TABLE','TOP','TRUNCATE TABLE','UNION','UNION ALL','UNIQUE','UPDATE','VALUES','VIEW','WHERE'];
		},
		'': function() {return [];}
	};
	
	window.languages = {
		'js': {
			keywords: () => {return keywords.js();},
			escapeChar: '\\',
			comment_singleLine: '//',
			comment_multiLineStart: '/*',
			comment_multiLineEnd: '*/',
			string_1: '"',
			string_2: "'",
			stringML_1: '`',
			stringML_2: '',
			identifierRegex: /[A-Za-z$_][\w|$]*/,
			numberRegex: /(?:\d+(?:\.|e|E)*)+/,
			symbolsRegex: /[+\-*\/%=!<>?:&|~^\[\]{}(),.;]+/
			// todo regex
		},
		'py': {
			keywords: () => {return keywords.py();},
			escapeChar: '\\',
			comment_singleLine: '#',
			comment_multiLineStart: '',
			comment_multiLineEnd: '',
			string_1: '"',
			string_2: "'",
			stringML_1: "'''",
			stringML_2: '"""',
			identifierRegex: /[A-Za-z_]\w*/,
			numberRegex: /(?:\d+(?:\.|e|E)*)+(?:j|J)?/,
			symbolsRegex: /[+\-*\/%=!<>?:&|~^\[\](),.;]+/
		},
		'java': {
			keywords: () => {return keywords.java();},
			escapeChar: '\\',
			comment_singleLine: '//',
			comment_multiLineStart: '/*',
			comment_multiLineEnd: '*/',
			string_1: '"',
			string_2: "'",
			stringML_1: '',
			stringML_2: '',
			identifierRegex: /[A-Za-z$_][\w|$]*/,
			numberRegex: /(?:\d+(?:\.)*)+/,
			symbolsRegex: /[+\-*\/%=!<>?:&|~^\[\]{}(),.;]+/
		},
		'c': {
			keywords: () => {return keywords.c();},
			escapeChar: '\\',
			comment_singleLine: '//',
			comment_multiLineStart: '/*',
			comment_multiLineEnd: '*/',
			string_1: '"',
			string_2: "'",
			stringML_1: '',
			stringML_2: '',
			identifierRegex: /[A-Za-z$_][\w|$]*/,
			numberRegex: /(?:\d+(?:\.|e|E)*)+/,// should accept F and the like
			symbolsRegex: /[+\-*\/%=!<>?:&|~^\[\]{}(),.;#]+/
			// todo preprocessor
		},
		'c++': {
			keywords: () => {return keywords['c++']();},
			escapeChar: '\\',
			comment_singleLine: '//',
			comment_multiLineStart: '/*',
			comment_multiLineEnd: '*/',
			string_1: '"',
			string_2: "'",
			stringML_1: '',
			stringML_2: '',
			identifierRegex: /[A-Za-z_][\w]*/,
			numberRegex: /(?:\d+(?:\.|e|E)*)+/,// should accept F and the like
			symbolsRegex: /[+\-*\/%=!<>?:&|~^\[\]{}(),.;#]+/
			// todo preprocessor # so that is valid
		},
		'sql': {
			keywords: () => {return keywords.sql();},
			escapeChar: '\\',// does it even have n escape
			comment_singleLine: '--',// not sure about anything else beyond here
			comment_multiLineStart: '',
			comment_multiLineEnd: '',
			string_1: '"',
			string_2: "'",
			stringML_1: '',
			stringML_2: '',
			identifierRegex: /[A-Za-z_][\w]*,
			numberRegex: /(?:\d+(?:\.)*)+/,
			symbolsRegex: /[+\-*\/%=!<>&|^(),;]+/
		},
		'': {
			keywords: () => {return keywords['']();},
			escapeChar: '',
			comment_singleLine: '',
			comment_multiLineStart: '',
			comment_multiLineEnd: '',
			string_1: '',
			string_2: "",
			stringML_1: '',
			stringML_2: '',
			identifierRegex: /.+/,
			numberRegex: '',
			symbolsRegex: ''
		},
		getActive: function() {
			let lang = document.querySelector('#lang .selectedOption') || '';

			if (lang) {
				lang = lang.dataset.val;
			}

			return this[lang];
		}
	};
})();
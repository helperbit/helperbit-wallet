const fs = require('fs');
const fpath = 'node_modules/bip39/src/wordlists/';
const toRemove = [
	'chinese_simplified.json',
	'chinese_traditional.json',
	'french.json',
	'italian.json',
	'japanese.json',
	'korean.json',
	'spanish.json'
];


toRemove.forEach(p => {
	fs.writeFile(fpath + p, "[]", 'utf8', function (err) {
		if (err) return console.log(err);
	});
});


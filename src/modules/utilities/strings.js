'use strict';
const subInvalidCharacters = (str) => {
	// for parsing the API data
	// add additional substitutions to this as needed
	return str.replaceAll('é', 'e');
};

const convertToKebabCase = (str) => {
	return subInvalidCharacters(str).replace(/\W/g, '-').toLowerCase();
};

const convertToCamelCase = (str) => {
	// get rid of anything that's not a 'word' letter and convert it to a space, then capitalise every item except for first, then join everything together
	return subInvalidCharacters(str)
		.toLowerCase()
		.replace(/\W/g, ' ')
		.split(' ')
		.map((item, index) => (index === 0 ? item : item.charAt(0).toUpperCase() + item.slice(1)))
		.join('');
};

const convertToId = (str) => {
	// convertToCamelCase, but also removes any numbers at the start, numbers at start make for invalid object keys
	// removing the first numbers from a string and escaping with a letter-character
	const idStr = convertToCamelCase(str).replace(/^([0-9]+)/, '');
	// ALWAYS lowercasing the first letter
	return `${idStr.charAt(0).toLowerCase()}${idStr.slice(1)}`;
};

const randomString = (length) => {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};

export { subInvalidCharacters, convertToKebabCase, convertToCamelCase, convertToId, randomString };

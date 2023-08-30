const subInvalidCharacters = (str: string) => {
	// for parsing the API data
	// add additional substitutions to this as needed
	return str.replaceAll('é', 'e').replaceAll('ʻ', "'").replaceAll('Š', 'S');
};

const convertToKebabCase = (str: string) => {
	return subInvalidCharacters(str).replace(/\W/g, '-').toLowerCase();
};

const convertToCamelCase = (str: string) => {
	// get rid of anything that's not a 'word' letter and convert it to a space, then capitalise every item except for first, then join everything together
	return subInvalidCharacters(str)
		.toLowerCase()
		.replace(/\W/g, ' ')
		.split(' ')
		.map((item, index) => (index === 0 ? item : item.charAt(0).toUpperCase() + item.slice(1)))
		.join('');
};

const convertToId = (str: string) => {
	// prepending each item with an underscore
	// special care to make sure first letter of first word with letters is always lowercased
	let idStr = subInvalidCharacters(str).toLowerCase().replace("'", '').replace(/\W/g, ' ');
	let nonNumericCharacterParsed = false;
	idStr = idStr
		.split(' ')
		.map((item) => {
			// if (!isNaN(item)) return item;
			if (nonNumericCharacterParsed) return item.charAt(0).toUpperCase() + item.slice(1);
			nonNumericCharacterParsed = true;
			// return numbers AND the first word as are (since it's already lowercased)
			return item;
		})
		.join('');
	// convertToCamelCase, but also removes any numbers at the start, numbers at start make for invalid object keys
	// removing the first numbers from a string and escaping with a letter-character
	return '_' + idStr;
};

const randomString = (length: number) => {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};

const hsl = (h: number | null, s?: number | null, l?: number | null) => `hsl(${h ?? 20}, ${s ?? 80}%, ${l ?? 70}%)`;

export { subInvalidCharacters, convertToKebabCase, convertToCamelCase, convertToId, randomString, hsl };

'use strict';
const IN_PRODUCTION = process.env.NODE_ENV === 'production';

// will strip out any unused classes
// needs tweaking, will seem to remove classes that are in fact in use
module.exports = {
	plugins: [
		IN_PRODUCTION &&
			require('./node_modules/@fullhuman/postcss-purgecss')({
				// content: ['./**/*.html', './src/**/*.vue'],
				content: ['./**/*.html'],
				defaultExtractor(content) {
					const contentWithoutStyleBlocks = content.replace(/<style[^]+?<\/style>/gi, '');
					return contentWithoutStyleBlocks.match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g) || [];
				},
				safelist: {
					standard: [/label*/, /is-*/, /behind-*/, /text-*/]
				}
			})
	]
};

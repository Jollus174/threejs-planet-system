// vite.config.js
import vitePluginString from 'vite-plugin-string';

export default {
	// config options
	base: './', // to ensure relative path is used, not absolute (I want to host this anywhere)
	plugins: [vitePluginString()]
};

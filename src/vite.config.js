'use strict';
import vitePluginString from 'vite-plugin-string';
import { createVuePlugin } from 'vite-plugin-vue2';

export default {
	// config options
	base: './', // to ensure relative path is used, not absolute (I want to host this anywhere)
	plugins: [vitePluginString(), createVuePlugin()],
	// css: {
	// 	preprocessorOptions: {
	// 		scss: {
	// 			additionalData: `@import "./src/scss/variables";`
	// 		}
	// 	}
	// },
	resolve: {
		alias: {
			// '@': path.resolve(__dirname, '/src'),
			// '~bootstrap': 'bootstrap'
		}
	},
	build: {
		outDir: '../dist/',
		emptyOutDir: true,
		chunkSizeWarningLimit: 1500,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						return id.toString().split('node_modules/')[1].split('/')[0].toString();
					}
				}
			}
		}
	}
};

'use strict';
import { DefaultLoadingManager, TextureLoader, ImageBitmapLoader } from 'three';

const loadManager = () => {
	const manager = DefaultLoadingManager;
	// const loadingProgressBar = document.querySelector('#bar');
	manager.onStart = (url, itemsLoaded, itemsTotal) => {
		console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
	};

	manager.onLoad = () => {
		// 	// console.log('Loading complete!');
		// 	document.querySelector('body').classList.remove('loading');
		// 	document.querySelector('body').classList.add('loaded');
	};

	// manager.onProgress = (url, itemsLoaded, itemsTotal) => {
	// console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
	// 	loadingProgressBar.style.setProperty('--progress-amount', `${(itemsLoaded / itemsTotal) * 100}%`);
	// };

	return manager;
};

const textureLoader = new TextureLoader(loadManager());
const imageBitmapLoader = new ImageBitmapLoader();
imageBitmapLoader.setOptions({
	imageOrientation: 'flipY'
});

export { loadManager, textureLoader, imageBitmapLoader };

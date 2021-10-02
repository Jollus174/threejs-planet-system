'use strict';
import { LoadingManager } from 'three';

const loadManager = () => {
	const manager = new LoadingManager();
	const loadingProgressBar = document.querySelector('#bar');
	manager.onStart = (url, itemsLoaded, itemsTotal) => {
		console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
	};

	manager.onLoad = () => {
		console.log('Loading complete!');
		document.querySelector('body').classList.remove('loading');
		document.querySelector('body').classList.add('loaded');
	};

	manager.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
		loadingProgressBar.style.setProperty('--progress-amount', `${(itemsLoaded / itemsTotal) * 100}%`);
	};

	return manager;
};

export { loadManager };

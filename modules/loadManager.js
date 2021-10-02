'use strict';
import { LoadingManager } from 'three';

const loadManager = () => {
	const manager = new LoadingManager();
	manager.onStart = (url, itemsLoaded, itemsTotal) => {
		console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
	};

	manager.onLoad = () => {
		console.log('Loading complete!');
		document.querySelector('#bg').style.visibility = 'visible';
	};

	manager.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
	};

	return manager;
};

export { loadManager };

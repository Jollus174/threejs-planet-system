/* globals bootstrap */
'use strict';
import { orrery } from '../orrery';

const setModalEvents = () => {
	// const modalInfoEl = document.querySelector('#modal-info');
	// const modalInfoButton = document.querySelector('#btn-modal-info');
	// suspend render animations while modal is open to save performance (at least in theory)
	// const modalInfoModal = new bootstrap.Modal(modalInfoEl, {});
	// modalInfoEl.addEventListener('show.bs.modal', () => {
	// 	cancelAnimationFrame(window.renderLoop);
	// });
	// modalInfoEl.addEventListener('hide.bs.modal', () => {
	// 	window.renderLoop = requestAnimationFrame(window.animate);
	// });
	/* modalInfoButton.addEventListener('click', () => {
		modalInfoModal.show();

		const { title, content, image, wikipediaKey, englishName } = orrery.mouseState._clickedClass.data;
		modalInfoEl.querySelector('.modal-title').textContent = title;
		modalInfoEl.querySelector('.modal-body').innerHTML = `
		  <img src="${image.source}" width="${image.width}" height="${image.height}" alt="${image.alt}" />
		  ${content}
		`;
		modalInfoEl.querySelector('#modal-info-read-more').href = `https://en.wikipedia.org/wiki/${
			wikipediaKey || englishName
		}`;
		console.log(content);
	}); */
};

export { setModalEvents };

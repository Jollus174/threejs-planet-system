/* globals bootstrap */
'use strict';
// Will render too huge of a chunk in the build...
// import './../../node_modules/bootstrap/dist/js/bootstrap';
import { state } from '../state';

const modalInfoEl = document.querySelector('#modalInfo');
const modalInfoModal = new bootstrap.Modal(modalInfoEl, {});
const modalInfoButton = document.querySelector('#modal-info-btn');

// suspend render animations while modal is open to save performance (at least in theory)
modalInfoEl.addEventListener('show.bs.modal', () => {
	cancelAnimationFrame(window.renderLoop);
});

modalInfoEl.addEventListener('hide.bs.modal', () => {
	window.renderLoop = requestAnimationFrame(window.animate);
});

modalInfoButton.addEventListener('click', () => {
	modalInfoModal.show();

	// TODO: this is to read from Vue!!
	const { title, content, image, wikipediaKey, englishName } = state.mouseState._clickedGroup.data;
	modalInfoEl.querySelector('.modal-title').textContent = title;
	console.log(image);
	modalInfoEl.querySelector('.modal-body').innerHTML = `
    <img src="${image.source}" width="${image.width}" height="${image.height}" alt="${image.alt}" />
    ${content}
  `;
	modalInfoEl.querySelector('#modal-info-read-more').href = `https://en.wikipedia.org/wiki/${
		wikipediaKey || englishName
	}`;
	console.log(content);
});

export { modalInfoEl, modalInfoModal, modalInfoButton };

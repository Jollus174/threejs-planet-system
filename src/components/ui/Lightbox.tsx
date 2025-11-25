import React, { useState, useEffect } from 'react';
import type { LightboxItem } from '../../types';

interface LightboxProps {
	media: LightboxItem[];
	showCaption?: boolean;
	showLightBox?: boolean;
	nThumbs?: number;
	interfaceHideTime?: number;
}

const Lightbox: React.FC<LightboxProps> = ({
	media,
	showCaption = true,
	showLightBox = false,
	nThumbs = 10,
	interfaceHideTime = 3000
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isOpen, setIsOpen] = useState(showLightBox);
	const [controlsHidden, setControlsHidden] = useState(false);

	useEffect(() => {
		if (isOpen) {
			document.body.classList.add('vib-open');
			document.addEventListener('keydown', handleKeyDown);
		} else {
			document.body.classList.remove('vib-open');
			document.removeEventListener('keydown', handleKeyDown);
		}
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen]);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			closeLightbox();
		} else if (e.key === 'ArrowLeft') {
			previousImage();
		} else if (e.key === 'ArrowRight') {
			nextImage();
		}
	};

	const showImage = (index: number) => {
		setCurrentIndex(index);
		setIsOpen(true);
		setControlsHidden(false);
	};

	const closeLightbox = () => {
		setIsOpen(false);
	};

	const nextImage = () => {
		setCurrentIndex((prev) => (prev + 1) % media.length);
		setControlsHidden(false);
	};

	const previousImage = () => {
		setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
		setControlsHidden(false);
	};

	if (!isOpen || media.length === 0) return null;

	const currentMedia = media[currentIndex];
	const halfDown = Math.floor(nThumbs / 2);
	const thumbIndex = {
		begin:
			currentIndex >= halfDown && currentIndex < media.length - halfDown
				? currentIndex - halfDown + (1 - (nThumbs % 2))
				: currentIndex < halfDown
				? 0
				: media.length - nThumbs,
		end:
			currentIndex >= halfDown && currentIndex < media.length - halfDown
				? currentIndex + halfDown
				: currentIndex < halfDown
				? nThumbs - 1
				: media.length - 1
	};

	return (
		<div className="vib-container" onClick={closeLightbox}>
			<div className="vib-content" onClick={(e) => e.stopPropagation()}>
				{currentMedia.type === 'image' && (
					<div className="vib-image">
						<img src={currentMedia.src} alt={currentMedia.caption} />
						{currentMedia.copyright && <div className="vib-copyright">{currentMedia.copyright}</div>}
					</div>
				)}
			</div>
			<div className={`vib-footer ${controlsHidden ? 'vib-hidden' : ''}`}>
				{showCaption && currentMedia.caption && <div dangerouslySetInnerHTML={{ __html: currentMedia.caption }} />}
				<div className="vib-footer-count">
					{currentIndex + 1} / {media.length}
				</div>
			</div>
			<button className={`vib-close ${controlsHidden ? 'vib-hidden' : ''}`} onClick={closeLightbox}>
				×
			</button>
			{media.length > 1 && (
				<>
					<button className={`vib-arrow vib-arrow-left ${controlsHidden ? 'vib-hidden' : ''}`} onClick={previousImage}>
						‹
					</button>
					<button className={`vib-arrow vib-arrow-right ${controlsHidden ? 'vib-hidden' : ''}`} onClick={nextImage}>
						›
					</button>
				</>
			)}
		</div>
	);
};

export default Lightbox;

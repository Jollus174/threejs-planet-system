import React, { useRef, useEffect, useMemo } from 'react';
import { CSS2DObject } from '../../modules/custom/jsm/renderers/CSS2DRenderer';
import { settings } from '../../modules/settings';
import { gsap } from 'gsap';
import type { BodyData } from '../../types';

interface LabelProps {
	data: BodyData;
	onPointerDown?: () => void;
	onMouseOver?: () => void;
	onMouseLeave?: () => void;
}

const Label: React.FC<LabelProps> = ({ data, onPointerDown, onMouseOver, onMouseLeave }) => {
	const labelLinkRef = useRef<HTMLAnchorElement | null>(null);
	const cssObjRef = useRef<CSS2DObject | null>(null);

	const entityTypeClasses = useMemo(() => {
		return [
			data.id === '_sun' ? 'is-sun' : '',
			data.aroundPlanet ? 'is-moon' : '',
			data.isPlanet ? 'is-planet' : '',
			data.isDwarfPlanet ? 'is-dwarf-planet' : '',
			data.isMajorMoon ? 'is-major-moon' : '',
			data.isInnerMoon ? 'is-inner-moon' : ''
		]
			.join(' ')
			.trim();
	}, [data]);

	useEffect(() => {
		if (!labelLinkRef.current) {
			const labelLink = document.createElement('a');
			labelLinkRef.current = labelLink;

			labelLink.className = `label behind-label ${entityTypeClasses}`;
			labelLink.dataset.selector = 'label';
			labelLink.style.color = data.labelColour || '#ffffff';
			labelLink.style.opacity = '0';
			labelLink.innerHTML = `
        <div class="label-content">
          <div class="label-circle"></div>
          <div class="label-text" style="color: ${
						data.labelColour !== settings.planetColours.default ? data.labelColour : ''
					};">${data.displayName}</div>
        </div>
      `;

			const cssObj = new CSS2DObject(labelLink, { data });
			cssObj.name = data.id;
			cssObj.position.set(0, 0, 0);
			cssObjRef.current = cssObj;

			if (onPointerDown) {
				labelLink.addEventListener('pointerdown', onPointerDown);
			}
			if (onMouseOver) {
				labelLink.addEventListener('mouseover', onMouseOver);
			}
			if (onMouseLeave) {
				labelLink.addEventListener('mouseleave', onMouseLeave);
			}

			gsap.to(labelLink, {
				opacity: 1,
				duration: 1
			});
		}

		return () => {
			if (labelLinkRef.current) {
				if (onPointerDown) {
					labelLinkRef.current.removeEventListener('pointerdown', onPointerDown);
				}
				if (onMouseOver) {
					labelLinkRef.current.removeEventListener('mouseover', onMouseOver);
				}
				if (onMouseLeave) {
					labelLinkRef.current.removeEventListener('mouseleave', onMouseLeave);
				}
			}
			if (cssObjRef.current) {
				cssObjRef.current.removeFromParent();
			}
		};
	}, [data, entityTypeClasses, onPointerDown, onMouseOver, onMouseLeave]);

	// This component doesn't render anything directly
	// The CSS2DObject is added to the parent group via imperative API
	return null;
};

export default Label;

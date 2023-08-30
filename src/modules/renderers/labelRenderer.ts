// @ts-ignore
import { CSS2DRenderer } from '../custom/jsm/renderers/CSS2DRenderer';

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';

export { labelRenderer };

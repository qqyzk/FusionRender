import { WebGLRenderTarget } from '../../../three.module.js';

// @TODO: Consider rename WebGLRenderTarget to just RenderTarget

class RenderTarget extends WebGLRenderTarget {

	constructor( width, height, options = {} ) {

		super( width, height, options );

	}

}

export default RenderTarget;

import DataMap from '../DataMap.js';
import { NoToneMapping, EquirectangularReflectionMapping, EquirectangularRefractionMapping } from 'three';
import { NodeFrame, cubeTexture, texture, rangeFog, densityFog, reference, toneMapping, positionWorld, modelWorldMatrix, transformDirection, equirectUV, viewportBottomLeft, frontFacing } from '../../../nodes/Nodes.js';

class Nodes extends DataMap {

	constructor( renderer, backend ) {

		super();

		this.renderer = renderer;
		this.backend = backend;
		this.nodeFrame = new NodeFrame();
		this.justUpdate = false;
		this.cacheKey = null;

	}

	getForRender( renderObject ) {

		const renderObjectData = this.get( renderObject );

		let nodeBuilder = renderObjectData.nodeBuilder;
		if ( nodeBuilder === undefined ) {
			nodeBuilder = this.backend.createNodeBuilder( renderObject.object, this.renderer );
			nodeBuilder.material = renderObject.material;
			nodeBuilder.lightsNode = renderObject.lightsNode;
			nodeBuilder.environmentNode = this.getEnvironmentNode( renderObject.scene );
			nodeBuilder.fogNode = this.getFogNode( renderObject.scene );
			nodeBuilder.toneMappingNode = this.getToneMappingNode();
			nodeBuilder.build();

			renderObjectData.nodeBuilder = nodeBuilder;

		}

		return nodeBuilder;

	}

	getForCompute( computeNode ) {

		const computeData = this.get( computeNode );

		let nodeBuilder = computeData.nodeBuilder;

		if ( nodeBuilder === undefined ) {

			nodeBuilder = this.backend.createNodeBuilder( computeNode, this.renderer );
			nodeBuilder.build();

			computeData.nodeBuilder = nodeBuilder;

		}

		return nodeBuilder;

	}

	getEnvironmentNode( scene ) {

		return scene.environmentNode || this.get( scene ).environmentNode || null;

	}

	getBackgroundNode( scene ) {

		return scene.backgroundNode || this.get( scene ).backgroundNode || null;

	}

	getFogNode( scene ) {

		return scene.fogNode || this.get( scene ).fogNode || null;

	}

	getToneMappingNode() {

		return this.renderer.toneMappingNode || this.get( this.renderer ).toneMappingNode || null;

	}

	getCacheKey( scene, lightsNode ) {
		
		
		const environmentNode = this.getEnvironmentNode( scene );
		const fogNode = this.getFogNode( scene );
		const toneMappingNode = this.getToneMappingNode();
		let needUpdate = false;
		if((lightsNode!==null && lightsNode.justUpdate) || (environmentNode !== null && environmentNode.justUpdate) || 
			(fogNode !==null && fogNode.justUpdate) || (toneMappingNode !== null && toneMappingNode.justUpdate)){
			needUpdate = true;
			if(lightsNode) lightsNode.justUpdate = false;
			if(environmentNode) environmentNode.justUpdate = false;
			if(fogNode) fogNode.justUpdate = false;
			if(toneMappingNode) toneMappingNode.justUpdate = false;
		}
		if(this.cacheKey!==null && needUpdate===false){
			return this.cacheKey;
		}

		const cacheKey = [];

		if ( lightsNode ) cacheKey.push( 'lightsNode:' + lightsNode.getCacheKey() );
		if ( environmentNode ) cacheKey.push( 'environmentNode:' + environmentNode.getCacheKey() );
		if ( fogNode ) cacheKey.push( 'fogNode:' + fogNode.getCacheKey() );
		if ( toneMappingNode ) cacheKey.push( 'toneMappingNode:' + toneMappingNode.getCacheKey() );
		this.cacheKey = '{' + cacheKey.join( ',' ) + '}'
		this.justUpdate = true;
		return this.cacheKey;

	}

	updateScene( scene ) {

		this.updateEnvironment( scene );
		this.updateFog( scene );
		this.updateBackground( scene );
		this.updateToneMapping();

	}

	updateToneMapping() {

		const renderer = this.renderer;
		const rendererData = this.get( renderer );
		const rendererToneMapping = renderer.toneMapping;

		if ( rendererToneMapping !== NoToneMapping ) {

			if ( rendererData.toneMapping !== rendererToneMapping ) {

				const rendererToneMappingNode = rendererData.rendererToneMappingNode || toneMapping( rendererToneMapping, reference( 'toneMappingExposure', 'float', renderer ) );
				rendererToneMappingNode.toneMapping = rendererToneMapping;

				rendererData.rendererToneMappingNode = rendererToneMappingNode;
				rendererData.toneMappingNode = rendererToneMappingNode;
				rendererData.toneMapping = rendererToneMapping;

			}

		} else {

			// Don't delete rendererData.rendererToneMappingNode
			delete rendererData.toneMappingNode;
			delete rendererData.toneMapping;

		}

	}

	updateBackground( scene ) {

		const sceneData = this.get( scene );
		const background = scene.background;

		if ( background ) {

			if ( sceneData.background !== background ) {

				let backgroundNode = null;

				if ( background.isCubeTexture === true ) {

					backgroundNode = cubeTexture( background, transformDirection( positionWorld, modelWorldMatrix ) );

				} else if ( background.isTexture === true ) {

					let nodeUV = null;

					if ( background.mapping === EquirectangularReflectionMapping || background.mapping === EquirectangularRefractionMapping ) {

						nodeUV = equirectUV();

					} else {

						nodeUV = viewportBottomLeft;

					}

					backgroundNode = texture( background, nodeUV );

				} else if ( background.isColor !== true ) {

					console.error( 'WebGPUNodes: Unsupported background configuration.', background );

				}

				sceneData.backgroundNode = backgroundNode;
				sceneData.background = background;

			}

		} else if ( sceneData.backgroundNode ) {

			delete sceneData.backgroundNode;
			delete sceneData.background;

		}

	}

	updateFog( scene ) {

		const sceneData = this.get( scene );
		const fog = scene.fog;

		if ( fog ) {

			if ( sceneData.fog !== fog ) {

				let fogNode = null;

				if ( fog.isFogExp2 ) {

					fogNode = densityFog( reference( 'color', 'color', fog ), reference( 'density', 'float', fog ) );

				} else if ( fog.isFog ) {

					fogNode = rangeFog( reference( 'color', 'color', fog ), reference( 'near', 'float', fog ), reference( 'far', 'float', fog ) );

				} else {

					console.error( 'WebGPUNodes: Unsupported fog configuration.', fog );

				}

				sceneData.fogNode = fogNode;
				sceneData.fog = fog;

			}

		} else {

			delete sceneData.fogNode;
			delete sceneData.fog;

		}

	}

	updateEnvironment( scene ) {

		const sceneData = this.get( scene );
		const environment = scene.environment;

		if ( environment ) {

			if ( sceneData.environment !== environment ) {

				let environmentNode = null;

				if ( environment.isCubeTexture === true ) {

					environmentNode = cubeTexture( environment );

				} else if ( environment.isTexture === true ) {

					environmentNode = texture( environment );

				} else {

					console.error( 'Nodes: Unsupported environment configuration.', environment );

				}

				sceneData.environmentNode = environmentNode;
				sceneData.environment = environment;

			}

		} else if ( sceneData.environmentNode ) {

			delete sceneData.environmentNode;
			delete sceneData.environment;

		}

	}

	getNodeFrame( renderObject ) {

		const nodeFrame = this.nodeFrame;
		nodeFrame.scene = renderObject.scene;
		nodeFrame.object = renderObject.object;
		nodeFrame.camera = renderObject.camera;
		nodeFrame.renderer = renderObject.renderer;
		nodeFrame.material = renderObject.material;

		return nodeFrame;

	}

	updateBefore( renderObject ) {
		const nodeFrame = this.getNodeFrame( renderObject );
		const nodeBuilder = this.getForRender( renderObject );

		for ( const node of nodeBuilder.updateBeforeNodes ) {
			// console.log('updatebefore',node);
			nodeFrame.updateBeforeNode( node );

		}

	}

	updateForCompute( /*computeNode*/ ) { }

	updateForRender( renderObject ) {

		const nodeFrame = this.getNodeFrame( renderObject );
		const nodeBuilder = this.getForRender( renderObject );
		for ( const node of nodeBuilder.updateNodes ) {
			// console.log('update',node);
			nodeFrame.updateNode( node );
		}

	}

	dispose() {

		super.dispose();

		this.nodeFrame = new NodeFrame();

	}

}

export default Nodes;

import { GPUFeatureName, GPUTextureFormat, GPULoadOp, GPUStoreOp, GPUIndexFormat, GPUTextureViewDimension } from './utils/WebGPUConstants.js';

import WebGPUNodeBuilder from './nodes/WGSLNodeBuilder.js';
import Backend from '../common/Backend.js';

import { DepthFormat, WebGPUCoordinateSystem } from 'three';

import WebGPUUtils from './utils/WebGPUUtils.js';
import WebGPUAttributeUtils from './utils/WebGPUAttributeUtils.js';
import WebGPUBindingUtils from './utils/WebGPUBindingUtils.js';
import WebGPUPipelineUtils from './utils/WebGPUPipelineUtils.js';
import WebGPUTextureUtils from './utils/WebGPUTextureUtils.js';
import listMap from './utils/listMap.js';
import UniformsGroup from '../common/UniformsGroup.js';
import ProgrammableStage from '../common/ProgrammableStage.js';
import { color, cos } from '../../nodes/Nodes.js';



// // statics

// let _staticAdapter = null;

// if ( navigator.gpu !== undefined ) {

// 	_staticAdapter = await navigator.gpu.requestAdapter();

// }
let print=true;
//

class WebGPUBackend extends Backend {

	constructor( parameters = {} ) {

		super( parameters );

		// some parameters require default values other than "undefined"

		this.parameters.antialias = ( parameters.antialias === true );

		if ( this.parameters.antialias === true ) {

			this.parameters.sampleCount = ( parameters.sampleCount === undefined ) ? 4 : parameters.sampleCount;

		} else {

			this.parameters.sampleCount = 1;

		}

		this.parameters.requiredLimits = ( parameters.requiredLimits === undefined ) ? {} : parameters.requiredLimits;

		this.adapter = null;
		this.device = null;
		this.context = null;
		this.colorBuffer = null;
		this.depthBuffer = null;

		this.utils = new WebGPUUtils( this );
		this.attributeUtils = new WebGPUAttributeUtils( this );
		this.bindingUtils = new WebGPUBindingUtils( this );
		this.pipelineUtils = new WebGPUPipelineUtils( this );
		this.textureUtils = new WebGPUTextureUtils( this );
		
		this.attributeid = 0;
		this.attributeArray = new listMap();
		this.Attributeids=new Map();
		this.indexattributeid = 0;
		this.indexattributeArray = new listMap();
		this.indexAttributeids=new WeakMap();
		this.bindingGroupsinfo = null;
		this.bindingGroups = null;
		this.bufferGPUs = []
		this.pipelineGPU = null;
		this.first=true;
		this.mergedArrays=[];
		this.indexOffset=[];
		this.vertexOffset=[];
		this.dataVision=[];
		this.renderPass = null;
		this.commandEncoder	= null;
		this.indexCache = null;
		this.pipelineMap = new Map();
		this.indexOffsetMap = new Map();
		this.indexAttributeMap = new Map();
		this.indexCacheMap = new Map();
		this.vertexOffsetMap = new Map();
		this.attributeMap = new Map();
		this.mergedArraysMap = new Map();
		this.bindingGroupsinfoMap = new Map();
		this.bufferGPUsMap = new Map();
		this.bindingGroupsMap = new Map();
		this.renderPassDescriptorFirst = null;
		this.renderPassDescriptorSecond = null;
		this.commandEncoder = null;
		this.renderPass = null;
		this.uniformBufferLimit = null;
		
	}

	async init( renderer ) {

		await super.init( renderer );

		//

		const parameters = this.parameters;

		const adapterOptions = {
			powerPreference: parameters.powerPreference
		};

		const adapter = await navigator.gpu.requestAdapter( adapterOptions );

		if ( adapter === null ) {

			throw new Error( 'WebGPUBackend: Unable to create WebGPU adapter.' );

		}

		// feature support

		const features = Object.values( GPUFeatureName );

		const supportedFeatures = [];

		for ( const name of features ) {

			if ( adapter.features.has( name ) ) {

				supportedFeatures.push( name );

			}

		}

		const deviceDescriptor = {
			requiredFeatures: supportedFeatures,
			requiredLimits: parameters.requiredLimits
		};

		const device = await adapter.requestDevice( deviceDescriptor );

		const context = ( parameters.context !== undefined ) ? parameters.context : renderer.domElement.getContext( 'webgpu' );

		this.adapter = adapter;
		this.device = device;
		this.context = context;

		this.updateSize();
		
	
		
	}

	get coordinateSystem() {

		return WebGPUCoordinateSystem;

	}

	async getArrayBuffer( attribute ) {

		return await this.attributeUtils.getArrayBuffer( attribute );

	}

	mybeginRender(renderContext){
		 //command encoder: records draw commands for submission
		 const commandEncoder = this.device.createCommandEncoder();
		 this.commandEncoder=commandEncoder;
		 //texture view: image view to the color buffer in this case
		 const textureView = this.context.getCurrentTexture().createView();
		 //renderPass: holds draw commands, allocated from command encoder
		 const renderPass = commandEncoder.beginRenderPass({
			 colorAttachments: [{
				 view: textureView,
				 // clearValue: {r: 0.5, g: 0.0, b: 0.25, a: 1.0},
				 clearValue: {r: 0.1, g: 0.1, b: 0.1, a: 1.0},
				 loadOp: "clear",
				 storeOp: "store"
			 }]
		 });
		 this.renderPass = renderPass;
	}
	myfinishRender(renderContext){
		this.renderPass.end();

        this.device.queue.submit([this.commandEncoder.finish()]);
   }
   createTwoRenderPassDescriptor( renderContext ){
		this.renderPassDescriptorFirst = this.createRenderPassDescriptor( renderContext,true );
		this.renderPassDescriptorSecond = this.createRenderPassDescriptor( renderContext,false );
   }

	createRenderPassDescriptor( renderContext,firstPass ){
		const descriptor = {
			colorAttachments: [ {
				view: null
			} ],
			depthStencilAttachment: {
				view: null
			}
		};
		const colorAttachment = descriptor.colorAttachments[ 0 ];
		const depthStencilAttachment = descriptor.depthStencilAttachment;
		const antialias = this.parameters.antialias;
		if ( renderContext.texture !== null ) {

			const textureData = this.get( renderContext.texture );
			const depthTextureData = this.get( renderContext.depthTexture );

			// @TODO: Support RenderTarget with antialiasing.

			colorAttachment.view = textureData.texture.createView( {
				baseMipLevel: 0,
				mipLevelCount: 1,
				baseArrayLayer: renderContext.activeCubeFace,
				dimension: GPUTextureViewDimension.TwoD
			} );

			depthStencilAttachment.view = depthTextureData.texture.createView();

			if ( renderContext.stencil && renderContext.depthTexture.format === DepthFormat ) {

				renderContext.stencil = false;

			}

		} else {

			if ( antialias === true ) {

				colorAttachment.view = this.colorBuffer.createView();
				colorAttachment.resolveTarget = this.context.getCurrentTexture().createView();

			} else {

				colorAttachment.view = this.context.getCurrentTexture().createView();
				colorAttachment.resolveTarget = undefined;

			}

			depthStencilAttachment.view = this.depthBuffer.createView();

		}

		if ( renderContext.clearColor && firstPass ) {

			colorAttachment.clearValue = renderContext.clearColorValue;
			colorAttachment.loadOp = GPULoadOp.Clear;
			colorAttachment.storeOp = GPUStoreOp.Store;

		} else {

			colorAttachment.loadOp = GPULoadOp.Load;
			colorAttachment.storeOp = GPUStoreOp.Store;

		}

		//

		if ( renderContext.depth ) {

			if ( renderContext.clearDepth ) {

				depthStencilAttachment.depthClearValue = renderContext.clearDepthValue;
				depthStencilAttachment.depthLoadOp = GPULoadOp.Clear;
				depthStencilAttachment.depthStoreOp = GPUStoreOp.Store;

			} else {

				depthStencilAttachment.depthLoadOp = GPULoadOp.Load;
				depthStencilAttachment.depthStoreOp = GPUStoreOp.Store;

			}

		}

		if ( renderContext.stencil ) {

			if ( renderContext.clearStencil ) {

				depthStencilAttachment.stencilClearValue = renderContext.clearStencilValue;
				depthStencilAttachment.stencilLoadOp = GPULoadOp.Clear;
				depthStencilAttachment.stencilStoreOp = GPUStoreOp.Store;

			} else {

				depthStencilAttachment.stencilLoadOp = GPULoadOp.Load;
				depthStencilAttachment.stencilStoreOp = GPUStoreOp.Store;

			}

		}
		return descriptor;

	}

	beginEncoder(renderContext,firstPass){
		const encoder = this.device.createCommandEncoder( { label: 'renderContext_' + renderContext.id } );
		let renderPassDescriptor;
		if(firstPass){
			renderPassDescriptor = this.renderPassDescriptorFirst;
		}else{
			renderPassDescriptor = this.renderPassDescriptorSecond;
		}
		const currentPass = encoder.beginRenderPass( renderPassDescriptor );
		if ( renderContext.viewport ) {
			const { x, y, width, height, minDepth, maxDepth } = renderContext.viewportValue;
			currentPass.setViewport( x, y, width, height, minDepth, maxDepth );
		}
		if ( renderContext.scissor ) {
			const { x, y, width, height } = renderContext.scissorValue;
			currentPass.setScissorRect( x, y, width, height );
		}
		this.commandEncoder = encoder;
		this.renderPass = currentPass;

	}

	endEncoder(renderContext){
		this.renderPass.end();
		this.device.queue.submit( [ this.commandEncoder.finish() ] );
		if ( renderContext.texture !== null && renderContext.texture.generateMipmaps === true ) {
			this.textureUtils.generateMipmaps( renderContext.texture );
		}
	}

	beginRender( renderContext ) {

		const renderContextData = this.get( renderContext );

		const device = this.device;

		const descriptor = {
			colorAttachments: [ {
				view: null
			} ],
			depthStencilAttachment: {
				view: null
			}
		};

		const colorAttachment = descriptor.colorAttachments[ 0 ];
		const depthStencilAttachment = descriptor.depthStencilAttachment;

		const antialias = this.parameters.antialias;

		if ( renderContext.texture !== null ) {

			const textureData = this.get( renderContext.texture );
			const depthTextureData = this.get( renderContext.depthTexture );

			// @TODO: Support RenderTarget with antialiasing.

			colorAttachment.view = textureData.texture.createView( {
				baseMipLevel: 0,
				mipLevelCount: 1,
				baseArrayLayer: renderContext.activeCubeFace,
				dimension: GPUTextureViewDimension.TwoD
			} );

			depthStencilAttachment.view = depthTextureData.texture.createView();

			if ( renderContext.stencil && renderContext.depthTexture.format === DepthFormat ) {

				renderContext.stencil = false;

			}

		} else {

			if ( antialias === true ) {

				colorAttachment.view = this.colorBuffer.createView();
				colorAttachment.resolveTarget = this.context.getCurrentTexture().createView();

			} else {

				colorAttachment.view = this.context.getCurrentTexture().createView();
				colorAttachment.resolveTarget = undefined;

			}

			depthStencilAttachment.view = this.depthBuffer.createView();

		}

		if ( renderContext.clearColor ) {

			colorAttachment.clearValue = renderContext.clearColorValue;
			colorAttachment.loadOp = GPULoadOp.Clear;
			colorAttachment.storeOp = GPUStoreOp.Store;

		} else {

			colorAttachment.loadOp = GPULoadOp.Load;
			colorAttachment.storeOp = GPUStoreOp.Store;

		}

		//

		if ( renderContext.depth ) {

			if ( renderContext.clearDepth ) {

				depthStencilAttachment.depthClearValue = renderContext.clearDepthValue;
				depthStencilAttachment.depthLoadOp = GPULoadOp.Clear;
				depthStencilAttachment.depthStoreOp = GPUStoreOp.Store;

			} else {

				depthStencilAttachment.depthLoadOp = GPULoadOp.Load;
				depthStencilAttachment.depthStoreOp = GPUStoreOp.Store;

			}

		}

		if ( renderContext.stencil ) {

			if ( renderContext.clearStencil ) {

				depthStencilAttachment.stencilClearValue = renderContext.clearStencilValue;
				depthStencilAttachment.stencilLoadOp = GPULoadOp.Clear;
				depthStencilAttachment.stencilStoreOp = GPUStoreOp.Store;

			} else {

				depthStencilAttachment.stencilLoadOp = GPULoadOp.Load;
				depthStencilAttachment.stencilStoreOp = GPUStoreOp.Store;

			}

		}

		//

		const encoder = device.createCommandEncoder( { label: 'renderContext_' + renderContext.id } );
		const currentPass = encoder.beginRenderPass( descriptor );

		//

		renderContextData.descriptor = descriptor;
		renderContextData.encoder = encoder;
		renderContextData.currentPass = currentPass;

		//

		if ( renderContext.viewport ) {

			this.updateViewport( renderContext );

		}

		if ( renderContext.scissor ) {

			const { x, y, width, height } = renderContext.scissorValue;

			currentPass.setScissorRect( x, y, width, height );

		}

	}

	finishRender( renderContext ) {

		const renderContextData = this.get( renderContext );

		renderContextData.currentPass.end();

		this.device.queue.submit( [ renderContextData.encoder.finish() ] );


		if ( renderContext.texture !== null && renderContext.texture.generateMipmaps === true ) {

			this.textureUtils.generateMipmaps( renderContext.texture );

		}
		
	}

	updateViewport( renderContext ) {

		const { currentPass } = this.get( renderContext );
		const { x, y, width, height, minDepth, maxDepth } = renderContext.viewportValue;

		currentPass.setViewport( x, y, width, height, minDepth, maxDepth );

	}

	clear( renderContext, color, depth, stencil ) {

		const device = this.device;
		const renderContextData = this.get( renderContext );

		const { descriptor } = renderContextData;

		depth = depth && renderContext.depth;
		stencil = stencil && renderContext.stencil;

		const colorAttachment = descriptor.colorAttachments[ 0 ];

		const antialias = this.parameters.antialias;

		// @TODO: Include render target in clear operation.
		if ( antialias === true ) {

			colorAttachment.view = this.colorBuffer.createView();
			colorAttachment.resolveTarget = this.context.getCurrentTexture().createView();

		} else {

			colorAttachment.view = this.context.getCurrentTexture().createView();
			colorAttachment.resolveTarget = undefined;

		}

		descriptor.depthStencilAttachment.view = this.depthBuffer.createView();

		if ( color ) {

			colorAttachment.loadOp = GPULoadOp.Clear;
			colorAttachment.clearValue = renderContext.clearColorValue;

		}

		if ( depth ) {

			descriptor.depthStencilAttachment.depthLoadOp = GPULoadOp.Clear;
			descriptor.depthStencilAttachment.depthClearValue = renderContext.clearDepthValue;

		}

		if ( stencil ) {

			descriptor.depthStencilAttachment.stencilLoadOp = GPULoadOp.Clear;
			descriptor.depthStencilAttachment.stencilClearValue = renderContext.clearStencilValue;

		}

		renderContextData.encoder = device.createCommandEncoder( {} );
		renderContextData.currentPass = renderContextData.encoder.beginRenderPass( descriptor );

		renderContextData.currentPass.end();

		device.queue.submit( [ renderContextData.encoder.finish() ] );

	}

	// compute

	beginCompute( computeGroup ) {

		const groupGPU = this.get( computeGroup );

		groupGPU.cmdEncoderGPU = this.device.createCommandEncoder( {} );
		groupGPU.passEncoderGPU = groupGPU.cmdEncoderGPU.beginComputePass();

	}

	compute( computeGroup, computeNode, bindings, pipeline ) {

		const { passEncoderGPU } = this.get( computeGroup );

		// pipeline

		const pipelineGPU = this.get( pipeline ).pipeline;
		passEncoderGPU.setPipeline( pipelineGPU );

		// bind group

		const bindGroupGPU = this.get( bindings ).group;
		passEncoderGPU.setBindGroup( 0, bindGroupGPU );

		passEncoderGPU.dispatchWorkgroups( computeNode.dispatchCount );

	}

	finishCompute( computeGroup ) {

		const groupData = this.get( computeGroup );

		groupData.passEncoderGPU.end();
		this.device.queue.submit( [ groupData.cmdEncoderGPU.finish() ] );

	}

	

	equalBindingGroupsInfo(info1,info2){
		if(info1.length!==info2.length){
			return false;
		}
		for(let i=0;i<info1.length;i++){
			if(info1[i].type!==info2[i].type || info1[i].length!==info2[i].length){
				return false;
			}
		}
		return true;
	}

	getWireFrameIndex( array ) {
		const indices = [];
		for ( let i = 0, l = array.length; i < l; i += 3 ) {
			const a = array[ i + 0 ];
			const b = array[ i + 1 ];
			const c = array[ i + 2 ];
			indices.push( a, b, b, c, c, a );
		}
		return indices;
	
	}

	mergedDraw2(scene,camera,renderObjects,first,renderListID,limit,useUniform,useSplit,lightsList) {	
		
		const passEncoderGPU = this.renderPass;
		const pipelineID = renderObjects[0].pipelineID;
		const pipelineExist = this.pipelineMap.has(pipelineID);
		// pipeline
		if(pipelineExist){
			passEncoderGPU.setPipeline( this.pipelineMap.get(pipelineID) );
		}
		const isStandrad = renderObjects[0].signature.shaderType === 'MeshStandardMaterial';
		
		// bind group
		// 目前全是uniform

		//get bindingLengths
		let isInstanceMesh = renderObjects[0].signature.isInstanceMesh;

		let hasIndex = renderObjects[0].geometry.index!==null;
		// if(this.newDataVersion(renderObjects)){
		if(first){	
			if(hasIndex){
				let indexCache = new Map();
				for(let i=0;i<renderObjects.length;i++){
					const index = renderObjects[i].geometry.index.array;
					if(indexCache.has(index)){
						indexCache.get(index).push(i);
					}else{
						indexCache.set(index,[i]);
					}
				}
				let isWireFrame = renderObjects[0].material.wireframe === true;
					
				
				const keysIterator = indexCache.keys();
				let totallength = 0;
				for (const key of keysIterator) {
					totallength+=key.length;
				}
				if(isWireFrame)
					totallength*=2;
				let tmpArray = new Uint32Array(totallength);

				let offset = 0;
				let indexOffset= new Array(renderObjects.length);
				for(const [index,idxs] of indexCache){
					let tmpAttribute;
					if(isWireFrame){
						tmpAttribute = this.getWireFrameIndex(index);
					} else{
						tmpAttribute =  index;
					} 
					tmpArray.set(tmpAttribute,offset);
					for(const idx of idxs){
						indexOffset[idx]=offset;
					}
					offset += tmpAttribute.length;	
				}
				this.indexOffsetMap.set(renderListID,indexOffset);
				const buffer = this.mycreateIndexAttribute( tmpArray );
				this.indexAttributeMap.set(renderListID,buffer);
				passEncoderGPU.setIndexBuffer( buffer, GPUIndexFormat.Uint32 );
			}
			let attributeCache = new listMap();
			for(let i=0;i<renderObjects.length;i++){
				const attribute1 = renderObjects[i].geometry.attributes.position.array;
				const attribute2 = renderObjects[i].geometry.attributes.normal.array;
				const key=[attribute1,attribute2];
				if(attributeCache.has(key)){
					attributeCache.get(key).push(i);
				}else{
					attributeCache.set(key,[i]);
				}
			}
			
			for(let i=0;i<2;i++){
				//create buffer
				const keysIterator = attributeCache.keys();
				let totallength = 0;
				for(const key of keysIterator){
					
					if(i===0)
						totallength += key[0].length;
					else if(i===1)
						totallength += key[1].length;
				}
				
				let tmpArray = new Float32Array(totallength);
				let offset = 0;
				let vertexOffset=new Array(renderObjects.length);
				let countOffset=0;
				
				for(const [attributes,idxs] of attributeCache.getmap()){
					let tmpAttribute;
					if(i===0)
						tmpAttribute=attributes[0];
					else if(i===1)
						tmpAttribute=attributes[1];
					tmpArray.set(tmpAttribute,offset);
					for(const idx of idxs){
						vertexOffset[idx]=countOffset;
					}
				
					offset += tmpAttribute.length;
					countOffset += renderObjects[idxs[0]].geometry.attributes.position.count;
				}
				this.vertexOffsetMap.set(renderListID,vertexOffset);
				const buffer = this.mycreateAttribute( tmpArray );
				if(i===0){
					this.attributeMap.set(renderListID,[buffer]);
				}else{
					this.attributeMap.get(renderListID).push(buffer);
				}
				passEncoderGPU.setVertexBuffer( i, buffer );
			}

		}else{
			
			if(hasIndex){
				const buffer = this.indexAttributeMap.get(renderListID);
				passEncoderGPU.setIndexBuffer( buffer, GPUIndexFormat.Uint32);
			}
			const buffers = this.attributeMap.get(renderListID);
			for(let i=0;i<2;i++){
				const buffer = buffers[i];
				passEncoderGPU.setVertexBuffer( i, buffer );
			}
		}
		
		
		if(first){
			let mergedArrays=[];
			let fragmentLength=4;
			if(isStandrad){
				fragmentLength=12;
				for(const light of lightsList){
					const lightType = light.type;
					if(lightType==='AmbientLight')
						fragmentLength+=4;
					else if(lightType==='PointLight')
						fragmentLength+=8;
						// fragmentLength+=12
				}
			}
			
			if(!useUniform&&!useSplit){
				mergedArrays.push(new Float32Array(44*renderObjects.length));
				mergedArrays.push(new Float32Array(fragmentLength*renderObjects.length));
				if(isInstanceMesh){
					mergedArrays.push(new Float32Array(renderObjects[0].instanceMatrix.array.length));
				}
			}else{
				mergedArrays.push(new Float32Array(44*limit));
				mergedArrays.push(new Float32Array(fragmentLength*limit));
	
			}
			this.mergedArraysMap.set(renderListID,mergedArrays);
		}
		let mergedArrays = this.mergedArraysMap.get(renderListID);
		
		for(let i=0;i<renderObjects.length;i++){
			
			const matrix0=renderObjects[i].normalMatrix;
			const matrix1=camera.projectionMatrix;
			const matrix2=renderObjects[i].modelViewMatrix;
			
			let binding0 = new Float32Array(44);
			binding0.set(matrix0.elements.slice(0,3),0);
			binding0.set(matrix0.elements.slice(3,6),4);
			binding0.set(matrix0.elements.slice(6,9),8);
			binding0.set(matrix1.elements,12);
			binding0.set(matrix2.elements,28);
			let binding1;
			if(useUniform||useSplit){
				binding1= new Float32Array(mergedArrays[1].length/limit);
			}else{
				binding1= new Float32Array(mergedArrays[1].length/renderObjects.length);
			}
			
			binding1.set(renderObjects[i].material.color.toArray(),0);
			binding1.set([renderObjects[i].material.opacity],3);
			if(isStandrad){
				binding1.set([renderObjects[i].material.metalness],4);
				binding1.set([renderObjects[i].material.roughness],5);
				let lightOffset=8;
				for(const light of lightsList){
					const lightType=light.type;
					if(lightType==='AmbientLight'){
						let color = light.color.toArray();
						for(let k=0;k<color.length;k++){
							color[k]*=light.intensity;
						}
						
						binding1.set(color,lightOffset);
						lightOffset+=4;
					}
					else if(lightType==='PointLight'){
						binding1.set(light.position.toArray(),lightOffset);
						let color = light.color.toArray();
						
						for(let k=0;k<color.length;k++){
							color[k]*=light.intensity;
						}
						
						binding1.set([light.distance],lightOffset+3);
						binding1.set(color,lightOffset+4);
						binding1.set([light.decay],lightOffset+7);
						lightOffset+=8;
					}
				}
				/*for(const light of lightsList){
					const lightType=light.type;
					if(lightType==='AmbientLight'){
						let color = light.color.toArray();
						for(let k=0;k<color.length;k++){
							color[k]*=light.intensity;
						}
						binding1.set(color,20);
					}else if(lightType==='PointLight'){
						binding1.set(light.position.toArray(),8);
						let color = light.color.toArray();
						
						for(let k=0;k<color.length;k++){
							color[k]*=light.intensity;
						}
						binding1.set(color,12);
						binding1.set([light.distance],15);
						
						binding1.set([light.decay],16);
						
					}
				}*/
				binding1.set(renderObjects[i].material.emissive.toArray(),binding1.length-4);
			}
			
			mergedArrays[0].set(binding0,i*binding0.length);
			
			mergedArrays[1].set(binding1,i*binding1.length);
			
		}
		
		if(isInstanceMesh){
			mergedArrays[2].set(renderObjects[0].instanceMatrix.array,0);
		}
		
		//create bindingGroups if needed
		let bindingGroupsinfo = [];
		for(let i=0;i<mergedArrays.length;i++){
			bindingGroupsinfo.push({type:'uniform',length:mergedArrays[i].length});
		}
		if(!pipelineExist){
			const pipelineGPU = this.pipelineUtils.createRenderPipelineBySignature2(renderObjects[0].signature,limit,useUniform,useSplit,lightsList)
			this.pipelineMap.set(pipelineID, pipelineGPU);
			passEncoderGPU.setPipeline( pipelineGPU );
		}
		if(first){
			this.bindingGroupsinfoMap.set(renderListID, bindingGroupsinfo);	
			this.mycreateBindingGroupsForList(bindingGroupsinfo,renderListID,pipelineID,useUniform,useSplit);
		}
		
	
		
		// update bindingGroups
		
		this.myupdateBindingForList(mergedArrays,renderListID);
		
		
		passEncoderGPU.setBindGroup( 0, this.bindingGroupsMap.get(renderListID) );
		
		
		const vertexOffset = this.vertexOffsetMap.get(renderListID);
		if(hasIndex){
			const indexOffset = this.indexOffsetMap.get(renderListID);
			if(isInstanceMesh){
				passEncoderGPU.drawIndexed( renderObjects[0].geometry.index.count, renderObjects[0].count,
					0, 0, 0 );
			}else{
				for(let i=0;i<renderObjects.length;i++){
					passEncoderGPU.drawIndexed( renderObjects[i].geometry.index.count, 1,
						indexOffset[i], vertexOffset[i], i );	
				}
				
			}
		}else{	
			if(isInstanceMesh){
				passEncoderGPU.draw( renderObjects[0].geometry.attributes.position.count, renderObjects[0].count,
					0, 0 );
			}else{
				for(let i=0;i<renderObjects.length;i++){
					passEncoderGPU.draw( renderObjects[i].geometry.attributes.position.count, 1,
							vertexOffset[i], i );
				}
			}
		}
		
	}

	getDataVersion(renderObjects){
		let indexVersion;
		for(let i=0;i<renderObjects.length;i++){
			
			if(renderObjects[i].geometry.index === null){
				indexVersion = -1;
			}else{
				indexVersion = renderObjects[i].geometry.index.version;
			}
			this.dataVision.push({
				'geometry': renderObjects[i].geometry.uuid,
				'positionVersion':renderObjects[i].geometry.attributes.position.version,
				'normalVersion':renderObjects[i].geometry.attributes.normal.version,
				'indexVersion':indexVersion,
			});
		}
	}

	equalVersion(dataVersion,renderObject){
		if(dataVersion.geometry!==renderObject.geometry.uuid){
			return false;
		}
		if(dataVersion.positionVersion!==renderObject.geometry.attributes.position.version){
			return false;
		}
		if(dataVersion.normalVersion!==renderObject.geometry.attributes.normal.version){
			return false;
		}
		if(renderObject.geometry.index===null){
			if(dataVersion.indexVersion!=-1){
				return false;
			}
		}else if(dataVersion.indexVersion!==renderObject.geometry.index.version){
			return false;
		}
		return true;
	}

	newDataVersion( renderObjects ) {
		if(this.first){
			this.first=false;
			this.getDataVersion(renderObjects);
			return true;
		}
		for(let i=0;i<renderObjects.length;i++){
			if(!this.equalVersion(this.dataVision[i],renderObjects[i])){
				this.getDataVersion(renderObjects);
				return true;
			}
		}
		return false;
	}

	mergedDraw(scene,camera,renderObjects,currentRenderContext) {	
		
		const  object = renderObjects[0];
		const contextData = this.get( currentRenderContext );
		const passEncoderGPU = contextData.currentPass;
	
		// pipeline
		if(this.pipelineGPU){
			passEncoderGPU.setPipeline( this.pipelineGPU );
		}
		
		// bind group
		// 目前全是uniform

		//get bindingLengths
		
		let isInstanceMesh = renderObjects[0].signature.isInstanceMesh;
		let mergedArrays=this.mergedArrays;
		if(mergedArrays.length===0){
			mergedArrays.push(new Float32Array(60*renderObjects.length));
			mergedArrays.push(new Float32Array(4*renderObjects.length));
			if(isInstanceMesh){
				// mergedArrays.push(new Float32Array(renderObjects[0].instanceMatrix.array.length));
				mergedArrays.push(new Float32Array(renderObjects[0].positionArray.length));
				mergedArrays.push(new Float32Array(renderObjects[0].quaternionArray.length));
				mergedArrays.push(new Float32Array(renderObjects[0].scaleArray.length));
			}
		}
	
		for(let i=0;i<renderObjects.length;i++){
			const matrix0=camera.projectionMatrix;
			const matrix1=camera.matrixWorldInverse;
			const matrix2=scene.matrixWorld;
			mergedArrays[0].set(matrix0.elements,i*60+0);
			mergedArrays[0].set(matrix1.elements,i*60+16);
			mergedArrays[0].set(matrix2.elements,i*60+32);
			mergedArrays[0].set(renderObjects[i].position.toArray(),i*60+48);
			mergedArrays[0].set(renderObjects[i].quaternion.toArray(),i*60+52);
			mergedArrays[0].set(renderObjects[i].scale.toArray(),i*60+56);
			mergedArrays[1].set(renderObjects[i].material.color.toArray(),i*4+0);
			mergedArrays[1].set([renderObjects[i].material.opacity],i*4+3);
		}
		if(isInstanceMesh){
			// mergedArrays[2].set(renderObjects[0].instanceMatrix.array,0);
			// mergedArrays[2].set(renderObjects[0].positionArray,0);
			// mergedArrays[3].set(renderObjects[0].quaternionArray,0);
			// mergedArrays[4].set(renderObjects[0].scaleArray,0);
			mergedArrays[2]=renderObjects[0].positionArray;
			mergedArrays[3]=renderObjects[0].quaternionArray;
			mergedArrays[4]=renderObjects[0].scaleArray;
		}
		
		
		//create bindingGroups if needed
		let bindingGroupsinfo = [];
		for(let i=0;i<mergedArrays.length;i++){
			bindingGroupsinfo.push({type:'uniform',length:mergedArrays[i].length});
		}
		
		
		if(this.bindingGroupsinfo===null || !this.equalBindingGroupsInfo(bindingGroupsinfo,this.bindingGroupsinfo)){
			this.bindingGroupsinfo = bindingGroupsinfo;	
			this.pipelineGPU = this.pipelineUtils.createRenderPipelineBySignature(renderObjects[0].signature);
			passEncoderGPU.setPipeline( this.pipelineGPU );
			//create pipeline
			this.mycreateBindingGroups(bindingGroupsinfo);
		
		}
		
		// update bindingGroups
		this.myupdateBinding(mergedArrays);
		passEncoderGPU.setBindGroup( 0, this.bindingGroups);
		let hasIndex = renderObjects[0].signature.hasIndex;
		
		if(this.newDataVersion(renderObjects)){
			if(hasIndex){
				let totallength = 0;
				for(let i=0;i<renderObjects.length;i++){
					totallength += renderObjects[i].geometry.index.array.length;
				}
				let tmpArray = new Uint32Array(totallength);
				let offset = 0;
				this.indexOffset=[];
				for(let i=0;i<renderObjects.length;i++){
					const index = renderObjects[i].geometry.index.array;
					let tmpAttribute =  index;
					tmpArray.set(tmpAttribute,offset);
					this.indexOffset.push(offset);
					offset += tmpAttribute.length;	
				}
				const buffer = this.mycreateIndexAttribute( tmpArray );
				this.indexattributeArray.set([0],buffer);
				passEncoderGPU.setIndexBuffer( buffer, GPUIndexFormat.Uint32 );
			}
			
			for(let i=0;i<2;i++){
				//create buffer
				let totallength = 0;
				for(let j=0;j<renderObjects.length;j++){
					if(i===0)
						totallength += renderObjects[j].geometry.attributes.position.array.length;
					else if(i===1)
						totallength += renderObjects[j].geometry.attributes.normal.array.length;
				}
				let tmpArray = new Float32Array(totallength);
				let offset = 0;
				this.vertexOffset=[];
				let countOffset=0;
				for(let j=0;j<renderObjects.length;j++){
					let tmpAttribute;
					if(i===0)
						tmpAttribute=renderObjects[j].geometry.attributes.position.array;
					else if(i===1)
						tmpAttribute=renderObjects[j].geometry.attributes.normal.array;
					tmpArray.set(tmpAttribute,offset);
					this.vertexOffset.push(countOffset);
					offset += tmpAttribute.length;
					countOffset += renderObjects[j].geometry.attributes.position.count;
				}
				const buffer = this.mycreateAttribute( tmpArray );
				this.attributeArray.set([i],buffer);
				passEncoderGPU.setVertexBuffer( i, buffer );
			}
		}else{
			if(hasIndex){
				const buffer = this.indexattributeArray.get([0]);
				passEncoderGPU.setIndexBuffer( buffer, GPUIndexFormat.Uint32);
			}
			for(let i=0;i<2;i++){
				const buffer = this.attributeArray.get([i]);
				passEncoderGPU.setVertexBuffer( i, buffer );
			}
		}
		
		if(hasIndex){
			if(isInstanceMesh){
				
				passEncoderGPU.drawIndexed( renderObjects[0].geometry.index.count, renderObjects[0].count,
					0, 0, 0 );
			}else{
				for(let i=0;i<renderObjects.length;i++){
					passEncoderGPU.drawIndexed( renderObjects[i].geometry.index.count, 1,
							this.indexOffset[i], this.vertexOffset[i], i );
				}
			}
		}else{
			if(isInstanceMesh){
				passEncoderGPU.draw( renderObjects[0].geometry.attributes.position.count, renderObjects[0].count,
					0, 0 );
			}else{
				for(let i=0;i<renderObjects.length;i++){
					passEncoderGPU.draw( renderObjects[i].geometry.attributes.position.count, 1,
							this.vertexOffset[i], i );
				}
			}
		}
		
	}

	// render object

	draw( renderObject, info ) {

		const { object, geometry, context, pipeline } = renderObject;
		// console.log(pipeline)
		
		const bindingsData = this.get( renderObject.getBindings() );
		const contextData = this.get( context );
		const pipelineGPU = this.get( pipeline ).pipeline;

		// pipeline
		const passEncoderGPU = contextData.currentPass;
		passEncoderGPU.setPipeline( pipelineGPU );

		// bind group

		const bindGroupGPU = bindingsData.group;
		passEncoderGPU.setBindGroup( 0, bindGroupGPU );
		// index

		const index = renderObject.getIndex();
		
		const hasIndex = ( index !== null );

		if ( hasIndex === true ) {

			const buffer = this.get( index ).buffer;

			const indexFormat = ( index.array instanceof Uint16Array ) ? GPUIndexFormat.Uint16 : GPUIndexFormat.Uint32;

			passEncoderGPU.setIndexBuffer( buffer, indexFormat );

		}

		// vertex buffers

		const attributes = renderObject.getAttributes();


		for ( let i = 0, l = attributes.length; i < l; i ++ ) {

			const buffer = this.get( attributes[ i ] ).buffer;
			passEncoderGPU.setVertexBuffer( i, buffer );

		}

		// draw

		const drawRange = geometry.drawRange;
		const firstVertex = drawRange.start;
		

		const instanceCount = this.getInstanceCount( renderObject );

		if ( hasIndex === true ) {
			
			const indexCount = ( drawRange.count !== Infinity ) ? drawRange.count : index.count;

			passEncoderGPU.drawIndexed( indexCount, instanceCount, firstVertex, 0, 0 );

			info.update( object, indexCount, instanceCount );

		} else {
			
			const positionAttribute = geometry.attributes.position;
			const vertexCount = ( drawRange.count !== Infinity ) ? drawRange.count : positionAttribute.count;

			passEncoderGPU.draw( vertexCount, instanceCount, firstVertex, 0 );

			info.update( object, vertexCount, instanceCount );

		}

	}

	// cache key

	needsUpdate( renderObject ) {
		console.log('needsupdate')
		const renderObjectGPU = this.get( renderObject );

		const { object, material } = renderObject;

		const utils = this.utils;

		const sampleCount = utils.getSampleCount( renderObject.context );
		const colorSpace = utils.getCurrentColorSpace( renderObject.context );
		const colorFormat = utils.getCurrentColorFormat( renderObject.context );
		const depthStencilFormat = utils.getCurrentDepthStencilFormat( renderObject.context );
		const primitiveTopology = utils.getPrimitiveTopology( object, material );

		let needsUpdate = false;

		if ( renderObjectGPU.sampleCount !== sampleCount || renderObjectGPU.colorSpace !== colorSpace ||
			renderObjectGPU.colorFormat !== colorFormat || renderObjectGPU.depthStencilFormat !== depthStencilFormat ||
            renderObjectGPU.primitiveTopology !== primitiveTopology ) {

			renderObjectGPU.sampleCount = sampleCount;
			renderObjectGPU.colorSpace = colorSpace;
			renderObjectGPU.colorFormat = colorFormat;
			renderObjectGPU.depthStencilFormat = depthStencilFormat;
			renderObjectGPU.primitiveTopology = primitiveTopology;

			needsUpdate = true;

		}

		return needsUpdate;

	}

	getCacheKey( renderObject ) {

		const { object, material } = renderObject;

		const utils = this.utils;
		const renderContext = renderObject.context;

		return [
			utils.getSampleCount( renderContext ),
			utils.getCurrentColorSpace( renderContext ), utils.getCurrentColorFormat( renderContext ), utils.getCurrentDepthStencilFormat( renderContext ),
			utils.getPrimitiveTopology( object, material )
		].join();

	}

	// textures

	createSampler( texture ) {

		this.textureUtils.createSampler( texture );

	}

	destroySampler( texture ) {

		this.textureUtils.destroySampler( texture );

	}

	createDefaultTexture( texture ) {

		this.textureUtils.createDefaultTexture( texture );

	}

	createTexture( texture ) {

		this.textureUtils.createTexture( texture );

	}

	updateTexture( texture ) {

		this.textureUtils.updateTexture( texture );

	}

	destroyTexture( texture ) {

		this.textureUtils.destroyTexture( texture );

	}

	// node builder

	createNodeBuilder( object, renderer ) {

		return new WebGPUNodeBuilder( object, renderer );

	}

	// program

	mycreateProgram( program ) {
		return {
			module: this.device.createShaderModule( { code: program.code, label: program.stage } ),
			entryPoint: 'main'
		};
	}

	createProgram( program ) {
		const programGPU = this.get( program );

		programGPU.module = {
			module: this.device.createShaderModule( { code: program.code, label: program.stage } ),
			entryPoint: 'main'
		};

	}

	destroyProgram( program ) {

		this.delete( program );

	}

	// pipelines
	mycreateRenderPipeline2(renderObject,attributes,context){
		// get shader
		let {vertexShader,fragmentShader}=this.getShaders2();
		
		// programmable stages
		let stageVertex = new ProgrammableStage( vertexShader, 'vertex' );
		let vertexModule = this.mycreateProgram( stageVertex );
		let stageFragment = new ProgrammableStage( fragmentShader, 'fragment' );
		let fragmentModule =  this.mycreateProgram( stageFragment );

		// determine render pipeline
		return this.pipelineUtils.mycreateRenderPipeline(vertexModule,fragmentModule,renderObject,attributes,context);
	}

	getObjectSignature( renderObject,context) {
		const utils = this.utils;
		const geometry = renderObject.geometry;
		const material = renderObject.material;
		let shaders; 
		//vertex
		let isInstanceMesh = renderObject.isInstancedMesh;
		
		if(isInstanceMesh){
			shaders=this.getShadersTmp();
		}else{
			shaders=this.getShaders();
		}
		
		let attributes = [];
		let objectAttributes = [renderObject.geometry.attributes.position,renderObject.geometry.attributes.normal];

		for ( let slot = 0; slot < objectAttributes.length; slot ++ ) {
			const geometryAttribute = objectAttributes[ slot ];
			const bytesPerElement = geometryAttribute.array.BYTES_PER_ELEMENT;

			const format = this.attributeUtils._getVertexFormat( geometryAttribute );

			let arrayStride = geometryAttribute.itemSize * bytesPerElement;
			let offset = 0;

			if ( geometryAttribute.isInterleavedBufferAttribute === true ) {
				arrayStride = geometryAttribute.data.stride * bytesPerElement;
				offset = geometryAttribute.offset * bytesPerElement;
			}
			const stepMode = this.pipelineUtils._getStepMode( geometryAttribute );
			attributes.push( {
				arrayStride: arrayStride,
				slot: slot, 
				offset: offset, 
				format: format,
				stepMode: stepMode
			});

		}
		let hasIndex = renderObject.geometry.index!==null;
		//fragment
		const colorFormat = utils.getCurrentColorFormat( context );
		let alphaBlendSrcFactor;
		let alphaBlendDstFactor;
		let alphaBlendOperation;
		let colorBlendSrcFactor;
		let colorBlendDstFactor;
		let colorBlendOperation;
		if ( this.pipelineUtils._getNeedBlend( material )) {
			const alphaBlend = this._getAlphaBlend( material );
			const colorBlend = this._getColorBlend( material );
			alphaBlendSrcFactor = alphaBlend.srcFactor;
			alphaBlendDstFactor = alphaBlend.dstFactor;
			alphaBlendOperation = alphaBlend.operation;
			colorBlendSrcFactor = colorBlend.srcFactor;
			colorBlendDstFactor = colorBlend.dstFactor;
			colorBlendOperation = colorBlend.operation;
		}
		const colorWriteMask = this.pipelineUtils._getColorWriteMask( material );

		//primitive
		const primitiveState = this.pipelineUtils._getPrimitiveState( renderObject, geometry, material );
		//depthStencil
		const depthStencilFormat = utils.getCurrentDepthStencilFormat( context );
		const depthCompare = this.pipelineUtils._getDepthCompare( material );
		let stencilCompare;
		let stencilFailOp;
		let stencilDepthFailOp;
		let stencilPassOp;
		if(material.stencilWrite){
			stencilCompare = this.pipelineUtils._getStencilCompare( material ),
			stencilCompare = this.pipelineUtils._getStencilOperation( material.stencilFail ),
			stencilDepthFailOp = this.pipelineUtils._getStencilOperation( material.stencilZFail ),
			stencilPassOp = this.pipelineUtils._getStencilOperation( material.stencilZPass )
		}
		
		//multisample
		const sampleCount = utils.getSampleCount( context );

		return {
			vertexShader: shaders.vertexShader,
			attributes: attributes,
			hasIndex: hasIndex,
			isInstanceMesh: isInstanceMesh,
			fragmentShader: shaders.fragmentShader,
			colorFormat: colorFormat,
			alphaBlendSrcFactor: alphaBlendSrcFactor,
			alphaBlendDstFactor: alphaBlendDstFactor,
			alphaBlendOperation: alphaBlendOperation,
			colorBlendSrcFactor: colorBlendSrcFactor,
			colorBlendDstFactor: colorBlendDstFactor,
			colorBlendOperation: colorBlendOperation,
			colorWriteMask: colorWriteMask,
			topology: primitiveState.topology,
			stripIndexFormat: primitiveState.stripIndexFormat,
			frontFace: primitiveState.frontFace,
			cullMode: primitiveState.cullMode,
			depthStencilFormat:depthStencilFormat,
			depthWriteEnabled: material.depthWrite,
			depthCompare: depthCompare,
			stencilCompare: stencilCompare,
			stencilFailOp: stencilFailOp,
			stencilDepthFailOp: stencilDepthFailOp,
			stencilPassOp: stencilPassOp,
			stencilReadMask: material.stencilFuncMask,
			stencilWriteMask: material.stencilWriteMask,
			sampleCount: sampleCount
		}
	}

	getObjectSignature2( renderObject,context) {
		const utils = this.utils;
		const geometry = renderObject.geometry;
		const material = renderObject.material;
		// let shaders; 
		// //vertex
		let isInstanceMesh = renderObject.isInstancedMesh;
		
		
		let attributes = [];
		let objectAttributes = [renderObject.geometry.attributes.position,renderObject.geometry.attributes.normal];

		for ( let slot = 0; slot < objectAttributes.length; slot ++ ) {
			const geometryAttribute = objectAttributes[ slot ];
			const bytesPerElement = geometryAttribute.array.BYTES_PER_ELEMENT;

			const format = this.attributeUtils._getVertexFormat( geometryAttribute );

			let arrayStride = geometryAttribute.itemSize * bytesPerElement;
			let offset = 0;

			if ( geometryAttribute.isInterleavedBufferAttribute === true ) {
				arrayStride = geometryAttribute.data.stride * bytesPerElement;
				offset = geometryAttribute.offset * bytesPerElement;
			}
			const stepMode = this.pipelineUtils._getStepMode( geometryAttribute );
			attributes.push( {
				arrayStride: arrayStride,
				slot: slot, 
				offset: offset, 
				format: format,
				stepMode: stepMode
			});

		}
		let hasIndex = renderObject.geometry.index!==null;
		//fragment
		const colorFormat = utils.getCurrentColorFormat( context );
		let alphaBlendSrcFactor;
		let alphaBlendDstFactor;
		let alphaBlendOperation;
		let colorBlendSrcFactor;
		let colorBlendDstFactor;
		let colorBlendOperation;
		if ( this.pipelineUtils._getNeedBlend( material )) {
			const alphaBlend = this._getAlphaBlend( material );
			const colorBlend = this._getColorBlend( material );
			alphaBlendSrcFactor = alphaBlend.srcFactor;
			alphaBlendDstFactor = alphaBlend.dstFactor;
			alphaBlendOperation = alphaBlend.operation;
			colorBlendSrcFactor = colorBlend.srcFactor;
			colorBlendDstFactor = colorBlend.dstFactor;
			colorBlendOperation = colorBlend.operation;
		}
		const colorWriteMask = this.pipelineUtils._getColorWriteMask( material );

		//primitive
		const primitiveState = this.pipelineUtils._getPrimitiveState( renderObject, geometry, material );
		//depthStencil
		const depthStencilFormat = utils.getCurrentDepthStencilFormat( context );
		const depthCompare = this.pipelineUtils._getDepthCompare( material );
		let stencilCompare;
		let stencilFailOp;
		let stencilDepthFailOp;
		let stencilPassOp;
		if(material.stencilWrite){
			stencilCompare = this.pipelineUtils._getStencilCompare( material ),
			stencilCompare = this.pipelineUtils._getStencilOperation( material.stencilFail ),
			stencilDepthFailOp = this.pipelineUtils._getStencilOperation( material.stencilZFail ),
			stencilPassOp = this.pipelineUtils._getStencilOperation( material.stencilZPass )
		}
		
		//multisample
		const sampleCount = utils.getSampleCount( context );

		return {
			shaderType:material.type,
			attributes: attributes,
			hasIndex: hasIndex,
			isInstanceMesh: isInstanceMesh,
			colorFormat: colorFormat,
			alphaBlendSrcFactor: alphaBlendSrcFactor,
			alphaBlendDstFactor: alphaBlendDstFactor,
			alphaBlendOperation: alphaBlendOperation,
			colorBlendSrcFactor: colorBlendSrcFactor,
			colorBlendDstFactor: colorBlendDstFactor,
			colorBlendOperation: colorBlendOperation,
			colorWriteMask: colorWriteMask,
			topology: primitiveState.topology,
			stripIndexFormat: primitiveState.stripIndexFormat,
			frontFace: primitiveState.frontFace,
			cullMode: primitiveState.cullMode,
			depthStencilFormat:depthStencilFormat,
			depthWriteEnabled: material.depthWrite,
			depthCompare: depthCompare,
			stencilCompare: stencilCompare,
			stencilFailOp: stencilFailOp,
			stencilDepthFailOp: stencilDepthFailOp,
			stencilPassOp: stencilPassOp,
			stencilReadMask: material.stencilFuncMask,
			stencilWriteMask: material.stencilWriteMask,
			sampleCount: sampleCount
		}
	}


	mycreateRenderPipeline(renderObject,attributes,context){
		// get shader
		let {vertexShader,fragmentShader}=this.getShaders();
		
		// programmable stages
		let stageVertex = new ProgrammableStage( vertexShader, 'vertex' );
		let vertexModule = this.mycreateProgram( stageVertex );
		let stageFragment = new ProgrammableStage( fragmentShader, 'fragment' );
		let fragmentModule =  this.mycreateProgram( stageFragment );

		// determine render pipeline
		return this.pipelineUtils.mycreateRenderPipeline(vertexModule,fragmentModule,renderObject,attributes,context);
	}

	createRenderPipeline( renderObject ) {

		this.pipelineUtils.createRenderPipeline( renderObject );

	}

	createComputePipeline( computePipeline ) {

		this.pipelineUtils.createComputePipeline( computePipeline );

	}

	// bindings

	createBindings( bindings, pipeline ) {

		this.bindingUtils.createBindings( bindings, pipeline );

	}

	


	// attributes

	createIndexAttribute( attribute ) {

		// this.attributeUtils.createAttribute( attribute, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST );
		this.get(attribute).id = this.indexattributeid;
		this.indexattributeid++;

	}
	// mycreateIndexAttribute( attribute ) {
	// }
	mycreateIndexAttribute( attribute ) {
		return this.attributeUtils.mycreateAttribute( attribute,  GPUBufferUsage.INDEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST  );
	}

	mycreateBindingGroups(bindingGroupsinfo){
		
		let bindingPoint = 0;
		const entriesGPU = [];
		this.bufferGPUs = [];
		for(let i = 0; i < bindingGroupsinfo.length; i++){
			if ( bindingGroupsinfo[i].type==='uniform' ) {
				const byteLength = bindingGroupsinfo[i].length*4;
				const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
				
				const bufferGPU = this.device.createBuffer( {
					label: 'bindingBuffer',
					size: byteLength,
					usage: usage
				} );
				entriesGPU.push( { binding: bindingPoint, resource: { buffer: bufferGPU,size:byteLength,offset:0} } );
				this.bufferGPUs.push(bufferGPU);
				bindingPoint++;
			}
		}
		let layoutGPU;
		layoutGPU = this.pipelineGPU.getBindGroupLayout( 0 );
		this.bindingGroups = this.device.createBindGroup( {
			layout: layoutGPU,
			entries: entriesGPU
		} );
	}
	mycreateBindingGroupsForList(bindingGroupsinfo,renderListID,pipelineID,useUniform,useSplit){
		
		let bindingPoint = 0;
		const entriesGPU = [];
		let bufferGPUs = [];
		for(let i = 0; i < bindingGroupsinfo.length; i++){
			if ( bindingGroupsinfo[i].type==='uniform' ) {
				const byteLength = bindingGroupsinfo[i].length*4;
				let usage;
				if(!useUniform){
					usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
				}else{
					usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
				}
				
				
				const bufferGPU = this.device.createBuffer( {
					label: 'bindingBuffer',
					size: byteLength,
					usage: usage
				} );
				entriesGPU.push( { binding: bindingPoint, resource: { buffer: bufferGPU,size:byteLength,offset:0} } );
				bufferGPUs.push(bufferGPU);
				bindingPoint++;
			}
		}
		this.bufferGPUsMap.set(renderListID,bufferGPUs);
		
		let layoutGPU;
		layoutGPU = this.pipelineMap.get(pipelineID).getBindGroupLayout( 0 );
		this.bindingGroupsMap.set(renderListID, this.device.createBindGroup( {
			layout: layoutGPU,
			entries: entriesGPU
		} ));
	}

	myupdateBinding(arrays){
		for(let i=0;i<arrays.length;i++){
			this.device.queue.writeBuffer(this.bufferGPUs[i],0,arrays[i],0);
		}
			
		
	}
	myupdateBindingForList(arrays,renderListID){
		let bufferGPUs = this.bufferGPUsMap.get(renderListID);
		for(let i=0;i<arrays.length;i++){
			this.device.queue.writeBuffer(bufferGPUs[i],0,arrays[i],0);
		}
	}

	createAttribute( attribute ) {
		// this.attributeUtils.createAttribute( attribute, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST );
		this.get(attribute).id = this.attributeid;
		this.attributeid++;
	}

	mycreateAttribute( attribute ) {
		return this.attributeUtils.mycreateAttribute( attribute, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST );
	}

	createStorageAttribute( attribute ) {

		this.attributeUtils.createAttribute( attribute, GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST );

	}

	updateAttribute( attribute ) {
		this.attributeUtils.updateAttribute( attribute );

	}

	destroyAttribute( attribute ) {

		this.attributeUtils.destroyAttribute( attribute );

	}

	// canvas

	updateSize() {

		this._configureContext();
		this._setupColorBuffer();
		this._setupDepthBuffer();

	}

	// utils public

	hasFeature( name ) {

		const adapter = this.adapter || _staticAdapter;

		//

		const features = Object.values( GPUFeatureName );

		if ( features.includes( name ) === false ) {

			throw new Error( 'THREE.WebGPURenderer: Unknown WebGPU GPU feature: ' + name );

		}

		//

		return adapter.features.has( name );

	}

	copyFramebufferToTexture( framebufferTexture, renderContext ) {

		const renderContextData = this.get( renderContext );

		const { encoder, descriptor } = renderContextData;

		const sourceGPU = this.context.getCurrentTexture();
		const destinationGPU = this.get( framebufferTexture ).texture;

		renderContextData.currentPass.end();

		encoder.copyTextureToTexture(
			{
			  texture: sourceGPU
			},
			{
			  texture: destinationGPU
			},
			[
				framebufferTexture.image.width,
				framebufferTexture.image.height
			]
		);

		descriptor.colorAttachments[ 0 ].loadOp = GPULoadOp.Load;
		if ( renderContext.depth ) descriptor.depthStencilAttachment.depthLoadOp = GPULoadOp.Load;
		if ( renderContext.stencil ) descriptor.depthStencilAttachment.stencilLoadOp = GPULoadOp.Load;

		renderContextData.currentPass = encoder.beginRenderPass( descriptor );

	}

	// utils

	_configureContext() {

		this.context.configure( {
			device: this.device,
			// format: GPUTextureFormat.BGRA8Unorm,
			format:navigator.gpu.getPreferredCanvasFormat(),
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
			alphaMode: 'premultiplied'
		} );

	}

	_setupColorBuffer() {

		if ( this.colorBuffer ) this.colorBuffer.destroy();

		const { width, height } = this.getDrawingBufferSize();
		const format = navigator.gpu.getPreferredCanvasFormat(); // @TODO: Move to WebGPUUtils

		this.colorBuffer = this.device.createTexture( {
			label: 'colorBuffer',
			size: {
				width: width,
				height: height,
				depthOrArrayLayers: 1
			},
			sampleCount: this.parameters.sampleCount,
			// format: GPUTextureFormat.BGRA8Unorm,
			format:format,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
		} );

	}

	_setupDepthBuffer() {

		if ( this.depthBuffer ) this.depthBuffer.destroy();

		const { width, height } = this.getDrawingBufferSize();

		this.depthBuffer = this.device.createTexture( {
			label: 'depthBuffer',
			size: {
				width: width,
				height: height,
				depthOrArrayLayers: 1
			},
			sampleCount: this.parameters.sampleCount,
			format: GPUTextureFormat.Depth24PlusStencil8,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
		} );

	}

}

export default WebGPUBackend;

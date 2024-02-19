import { Box3,Sphere,Mesh,InstancedBufferAttribute,Matrix4,Quaternion } from 'three';

const _identity = /*@__PURE__*/ new Matrix4();
class InstancedMesh extends Mesh {

	constructor( geometry, material, count ) {
       
		super( geometry, material );

		this.isInstancedMesh = true;

		this.instanceMatrix = new InstancedBufferAttribute( new Float32Array( count * 16 ), 16 );
        this.positionArray = new Float32Array( count * 4 );
        this.quaternionArray = new Float32Array( count * 4 );
        this.scaleArray = new Float32Array( count * 4 );

		this.instanceColor = null;

		this.count = count;

		this.boundingBox = null;
		this.boundingSphere = null;

		for ( let i = 0; i < count; i ++ ) {

			this.setMatrixAt( i, _identity );

		}

	}

    setPositionAt( index, position ) {
        this.positionArray.set( position, index * 4 );
    }
    setQuaternionAt( index, quaternion ) {
        this.quaternionArray.set(quaternion, index * 4)
    }
    setRotationAt( index, rotation ) {
       const x=rotation[0], y=rotation[1], z=rotation[2];
       const cos = Math.cos;
	   const sin = Math.sin;
       const c1 = cos( x / 2 );
	   const c2 = cos( y / 2 );
	   const c3 = cos( z / 2 );

	   const s1 = sin( x / 2 );
	   const s2 = sin( y / 2 );
	   const s3 = sin( z / 2 );
       const _x = s1 * c2 * c3 + c1 * s2 * s3;
	   const _y = c1 * s2 * c3 - s1 * c2 * s3;
	   const _z = c1 * c2 * s3 + s1 * s2 * c3;
	   const _w = c1 * c2 * c3 - s1 * s2 * s3;
       this.quaternionArray.set( [_x,_y,_z,_w], index * 4 );
    }
   

    setScaleAt( index, scale ) {
       this.scaleArray.set( scale, index * 4 );
    }

    setObjectAt( index, object ) {
        this.setPositionAt( index, object.position.toArray() );
        this.setQuaternionAt( index, object.quaternion.toArray() );
        this.setScaleAt( index, object.scale.toArray() );
    }

	computeBoundingBox() {

		const geometry = this.geometry;
		const count = this.count;

		if ( this.boundingBox === null ) {

			this.boundingBox = new Box3();

		}

		if ( geometry.boundingBox === null ) {

			geometry.computeBoundingBox();

		}

		this.boundingBox.makeEmpty();

		for ( let i = 0; i < count; i ++ ) {

			this.getMatrixAt( i, _instanceLocalMatrix );

			_box3.copy( geometry.boundingBox ).applyMatrix4( _instanceLocalMatrix );

			this.boundingBox.union( _box3 );

		}

	}

	computeBoundingSphere() {

		const geometry = this.geometry;
		const count = this.count;

		if ( this.boundingSphere === null ) {

			this.boundingSphere = new Sphere();

		}

		if ( geometry.boundingSphere === null ) {

			geometry.computeBoundingSphere();

		}

		this.boundingSphere.makeEmpty();

		for ( let i = 0; i < count; i ++ ) {

			this.getMatrixAt( i, _instanceLocalMatrix );

			_sphere$2.copy( geometry.boundingSphere ).applyMatrix4( _instanceLocalMatrix );

			this.boundingSphere.union( _sphere$2 );

		}

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.instanceMatrix.copy( source.instanceMatrix );

		if ( source.instanceColor !== null ) this.instanceColor = source.instanceColor.clone();

		this.count = source.count;

		if ( source.boundingBox !== null ) this.boundingBox = source.boundingBox.clone();
		if ( source.boundingSphere !== null ) this.boundingSphere = source.boundingSphere.clone();

		return this;

	}

	getColorAt( index, color ) {

		color.fromArray( this.instanceColor.array, index * 3 );

	}

	getMatrixAt( index, matrix ) {

		matrix.fromArray( this.instanceMatrix.array, index * 16 );

	}

	raycast( raycaster, intersects ) {

		const matrixWorld = this.matrixWorld;
		const raycastTimes = this.count;

		_mesh.geometry = this.geometry;
		_mesh.material = this.material;

		if ( _mesh.material === undefined ) return;

		// test with bounding sphere first

		if ( this.boundingSphere === null ) this.computeBoundingSphere();

		_sphere$2.copy( this.boundingSphere );
		_sphere$2.applyMatrix4( matrixWorld );

		if ( raycaster.ray.intersectsSphere( _sphere$2 ) === false ) return;

		// now test each instance

		for ( let instanceId = 0; instanceId < raycastTimes; instanceId ++ ) {

			// calculate the world matrix for each instance

			this.getMatrixAt( instanceId, _instanceLocalMatrix );

			_instanceWorldMatrix.multiplyMatrices( matrixWorld, _instanceLocalMatrix );

			// the mesh represents this single instance

			_mesh.matrixWorld = _instanceWorldMatrix;

			_mesh.raycast( raycaster, _instanceIntersects );

			// process the result of raycast

			for ( let i = 0, l = _instanceIntersects.length; i < l; i ++ ) {

				const intersect = _instanceIntersects[ i ];
				intersect.instanceId = instanceId;
				intersect.object = this;
				intersects.push( intersect );

			}

			_instanceIntersects.length = 0;

		}

	}

	setColorAt( index, color ) {

		if ( this.instanceColor === null ) {

			this.instanceColor = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 3 ), 3 );

		}

		color.toArray( this.instanceColor.array, index * 3 );

	}

	setMatrixAt( index, matrix ) {

		matrix.toArray( this.instanceMatrix.array, index * 16 );

	}

	updateMorphTargets() {

	}

	dispose() {

		this.dispatchEvent( { type: 'dispose' } );

	}

}
export { InstancedMesh };
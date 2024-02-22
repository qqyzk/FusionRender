  
    getShaders(){
        let vertexShader = `// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            projectionMatrix : mat4x4<f32>,
            matrixWorldInverse : mat4x4<f32>,
            sceneMatrixWorld : mat4x4<f32>,
            objectPosition : vec4<f32>,
            objectQuaternion : vec4<f32>,
            objectScale : vec4<f32>
        };
        @binding( 0 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        // varyings
        struct NodeVaryingsStruct {
            @location( 1 ) nodeVarying1 : vec3<f32>,
            @location(2) @interpolate(flat) index : u32,
            @builtin( position ) Vertex : vec4<f32>
            
        };
        
    
        // 矩阵逆函数
        fn invert(mat : mat3x3<f32>) -> mat3x3<f32> {
            // 计算逆矩阵的算法
            var n11 : f32 = mat[0][0]; var n21 : f32 = mat[1][0]; var n31 : f32 = mat[2][0];
            var	n12 : f32 = mat[0][1]; var n22 : f32 = mat[1][1]; var n32 : f32 = mat[2][1];
            var	n13 : f32 = mat[0][2]; var n23 : f32 = mat[1][2]; var n33 : f32 = mat[2][2];
    
            var t11 : f32 = n33 * n22 - n32 * n23;
            var	t12 : f32 = n32 * n13 - n33 * n12;
            var	t13 : f32 = n23 * n12 - n22 * n13;
    
            var det : f32 = n11 * t11 + n21 * t12 + n31 * t13;
    
            // 如果行列式为0, 则逆矩阵不存在
            if (abs(det) < 0.00001) {
                // 返回一个全为0的矩阵表示逆矩阵不存在
                return mat3x3<f32>(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
            }
    
            var detInv : f32 = 1.0 / det;
    
            // 构建逆矩阵
            var inverseMat : mat3x3<f32> = mat3x3<f32>(
                t11 * detInv,  (n31 * n23 - n33 * n21) * detInv,  (n32 * n21 - n31 * n22) * detInv,
                t12 * detInv,  (n33 * n11 - n31 * n13) * detInv,  (n31 * n12 - n32 * n11) * detInv,
                t13 * detInv,  (n21 * n13 - n23 * n11) * detInv,  (n22 * n11 - n21 * n12) * detInv
            );
    
            return inverseMat;
        }
        // 获取normal matrix的函数实现
        fn transpose(inputMatrix : mat3x3<f32>) -> mat3x3<f32> {
            // 构建转置矩阵
            var transposeMat : mat3x3<f32> = mat3x3<f32>(
                inputMatrix[0][0], inputMatrix[1][0], inputMatrix[2][0],
                inputMatrix[0][1], inputMatrix[1][1], inputMatrix[2][1],
                inputMatrix[0][2], inputMatrix[1][2], inputMatrix[2][2]
            );
    
            return transposeMat;
        }
    
        
    
        // 获取normal matrix的函数实现
        fn getNormalMatrix(inputMatrix : mat4x4<f32>) -> mat3x3<f32> {
            // 提取inputMatrix的前三行三列
            var subMatrix : mat3x3<f32> = mat3x3<f32>(inputMatrix[0].xyz, inputMatrix[1].xyz, inputMatrix[2].xyz);
    
            // 计算该3x3子矩阵的逆矩阵
            var inverseMatrix : mat3x3<f32> = invert(subMatrix);
    
            // 计算该逆矩阵的转置矩阵
            var normalMatrix : mat3x3<f32> = transpose(inverseMatrix);
    
            return normalMatrix;
        }
    
        fn compose(position: vec4<f32>, quaternion: vec4<f32>, scale: vec4<f32>) -> mat4x4<f32> {
            var x : f32 = quaternion[0]; var y : f32 = quaternion[1]; var z : f32 = quaternion[2]; var w : f32 = quaternion[3];
    
            var x2 : f32 = x + x; var y2 : f32 = y + y; var z2 : f32 = z + z;
            var xx : f32 = x * x2; var xy : f32 = x * y2; var xz : f32 = x * z2;
            var yy : f32 = y * y2; var yz : f32 = y * z2; var zz : f32 = z * z2;
            var wx : f32 = w * x2; var wy : f32 = w * y2; var wz : f32 = w * z2;
    
            var sx : f32 = scale[0]; var sy : f32 = scale[1]; var sz : f32 = scale[2];
    
            // 设置矩阵的各个元素
            var te : mat4x4<f32> = mat4x4<f32>(
                (1.0 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0.0,
                (xy - wz) * sy, (1.0 - (xx + zz)) * sy, (yz + wx) * sy, 0.0,
                (xz + wy) * sz, (yz - wx) * sz, (1.0 - (xx + yy)) * sz, 0.0,
                position.x, position.y, position.z, 1.0
            );
            
    
            return te;
        }
    
        // codes
        @vertex
        fn main(  @builtin(instance_index) index : u32, @location( 0 ) position : vec3<f32>,
            @location( 1 ) normal : vec3<f32>) -> NodeVaryingsStruct {
            
            var NodeVaryings: NodeVaryingsStruct;
            var objectMatrix : mat4x4<f32>;
            objectMatrix = compose( NodeUniforms[index].objectPosition, NodeUniforms[index].objectQuaternion, NodeUniforms[index].objectScale);
            var objectMatrixWorld : mat4x4<f32>;
            objectMatrixWorld = NodeUniforms[index].sceneMatrixWorld * objectMatrix;
            var modelViewMatrix : mat4x4<f32>;
            modelViewMatrix = NodeUniforms[index].matrixWorldInverse * objectMatrixWorld;
            var normalMatrix : mat3x3<f32>;
            normalMatrix = getNormalMatrix( modelViewMatrix );
            NodeVaryings.nodeVarying1 = ( normalMatrix * normal );
            NodeVaryings.index = index;
            
            NodeVaryings.Vertex = ( ( NodeUniforms[index].projectionMatrix * modelViewMatrix ) * vec4<f32>(position, 1.0 ) );
            return NodeVaryings;
        }`
        
        let fragmentShader=`// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            color : vec3<f32>,
            opacity : f32,
            
        };
        @binding( 1 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        // codes
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        }
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>, 
            @location(2) @interpolate(flat) index:u32) -> @location( 0 ) vec4<f32> {
            // vars	
            var TransformedNormalView : vec3<f32>;
            var DiffuseColor : vec4<f32>;
            var nodeVar2 : vec4<f32>;
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            // flow
            // code
            TransformedNormalView = normalize( nodeVarying1 );
            TransformedNormalView = normalize( nodeVarying1 );
            DiffuseColor = vec4<f32>( NodeUniforms[index].color, 1.0 );
            DiffuseColor.w = ( DiffuseColor.w * NodeUniforms[index].opacity);
            nodeVar2 = vec4<f32>( DiffuseColor.xyz, DiffuseColor.w );
            // result
            return vec4<f32>( mix( ( ( pow( nodeVar2.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar2.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar2.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar2.w );
        }`
        return {vertexShader,fragmentShader}
    }
    
    
    getShadersTmp(){
        let vertexShader = `// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStructVertex {
            projectionMatrix : mat4x4<f32>,
            matrixWorldInverse : mat4x4<f32>,
            sceneMatrixWorld : mat4x4<f32>,
            objectPosition : vec4<f32>,
            objectQuaternion : vec4<f32>,
            objectScale : vec4<f32>
        };
        @binding( 0 ) @group( 0 )
        var<storage,read> NodeUniformsVertex : array<NodeUniformsStructVertex>;
        @binding( 2 ) @group( 0 )
        var<storage,read> positionArray : array<vec4<f32>>;
        @binding( 3 ) @group( 0 )
        var<storage,read> quaternionArray : array<vec4<f32>>;
        @binding( 4 ) @group( 0 )
        var<storage,read> scaleArray : array<vec4<f32>>;
        // varyings
        struct NodeVaryingsStruct {
            @location( 1 ) nodeVarying1 : vec3<f32>,
            @location(2) @interpolate(flat) index : u32,
            @builtin( position ) Vertex : vec4<f32>
            
        };
        
    
        // 矩阵逆函数
        fn invert(mat : mat3x3<f32>) -> mat3x3<f32> {
            // 计算逆矩阵的算法
            var n11 : f32 = mat[0][0]; var n21 : f32 = mat[1][0]; var n31 : f32 = mat[2][0];
            var	n12 : f32 = mat[0][1]; var n22 : f32 = mat[1][1]; var n32 : f32 = mat[2][1];
            var	n13 : f32 = mat[0][2]; var n23 : f32 = mat[1][2]; var n33 : f32 = mat[2][2];
    
            var t11 : f32 = n33 * n22 - n32 * n23;
            var	t12 : f32 = n32 * n13 - n33 * n12;
            var	t13 : f32 = n23 * n12 - n22 * n13;
    
            var det : f32 = n11 * t11 + n21 * t12 + n31 * t13;
    
            // 如果行列式为0, 则逆矩阵不存在
            if (abs(det) < 0.00001) {
                // 返回一个全为0的矩阵表示逆矩阵不存在
                return mat3x3<f32>(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
            }
    
            var detInv : f32 = 1.0 / det;
    
            // 构建逆矩阵
            var inverseMat : mat3x3<f32> = mat3x3<f32>(
                t11 * detInv,  (n31 * n23 - n33 * n21) * detInv,  (n32 * n21 - n31 * n22) * detInv,
                t12 * detInv,  (n33 * n11 - n31 * n13) * detInv,  (n31 * n12 - n32 * n11) * detInv,
                t13 * detInv,  (n21 * n13 - n23 * n11) * detInv,  (n22 * n11 - n21 * n12) * detInv
            );
    
            return inverseMat;
        }
        // 获取normal matrix的函数实现
        fn transpose(inputMatrix : mat3x3<f32>) -> mat3x3<f32> {
            // 构建转置矩阵
            var transposeMat : mat3x3<f32> = mat3x3<f32>(
                inputMatrix[0][0], inputMatrix[1][0], inputMatrix[2][0],
                inputMatrix[0][1], inputMatrix[1][1], inputMatrix[2][1],
                inputMatrix[0][2], inputMatrix[1][2], inputMatrix[2][2]
            );
    
            return transposeMat;
        }
    
        
    
        // 获取normal matrix的函数实现
        fn getNormalMatrix(inputMatrix : mat4x4<f32>) -> mat3x3<f32> {
            // 提取inputMatrix的前三行三列
            var subMatrix : mat3x3<f32> = mat3x3<f32>(inputMatrix[0].xyz, inputMatrix[1].xyz, inputMatrix[2].xyz);
    
            // 计算该3x3子矩阵的逆矩阵
            var inverseMatrix : mat3x3<f32> = invert(subMatrix);
    
            // 计算该逆矩阵的转置矩阵
            var normalMatrix : mat3x3<f32> = transpose(inverseMatrix);
    
            return normalMatrix;
        }
    
        fn compose(position: vec4<f32>, quaternion: vec4<f32>, scale: vec4<f32>) -> mat4x4<f32> {
            var x : f32 = quaternion[0]; var y : f32 = quaternion[1]; var z : f32 = quaternion[2]; var w : f32 = quaternion[3];
    
            var x2 : f32 = x + x; var y2 : f32 = y + y; var z2 : f32 = z + z;
            var xx : f32 = x * x2; var xy : f32 = x * y2; var xz : f32 = x * z2;
            var yy : f32 = y * y2; var yz : f32 = y * z2; var zz : f32 = z * z2;
            var wx : f32 = w * x2; var wy : f32 = w * y2; var wz : f32 = w * z2;
    
            var sx : f32 = scale[0]; var sy : f32 = scale[1]; var sz : f32 = scale[2];
    
            // 设置矩阵的各个元素
            var te : mat4x4<f32> = mat4x4<f32>(
                (1.0 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0.0,
                (xy - wz) * sy, (1.0 - (xx + zz)) * sy, (yz + wx) * sy, 0.0,
                (xz + wy) * sz, (yz - wx) * sz, (1.0 - (xx + yy)) * sz, 0.0,
                position.x, position.y, position.z, 1.0
            );
            
    
            return te;
        }
    
        // codes
        @vertex
        fn main(  @builtin(instance_index) index : u32, @location( 0 ) position : vec3<f32>,
            @location( 1 ) normal : vec3<f32>) -> NodeVaryingsStruct {
            
            var NodeVaryings: NodeVaryingsStruct;
            var objectMatrix : mat4x4<f32>;
            objectMatrix = compose( NodeUniformsVertex[index].objectPosition, NodeUniformsVertex[index].objectQuaternion, NodeUniformsVertex[index].objectScale);
            var objectMatrixWorld : mat4x4<f32>;
            objectMatrixWorld = NodeUniformsVertex[index].sceneMatrixWorld * objectMatrix;
            var modelViewMatrix : mat4x4<f32>;
            modelViewMatrix = NodeUniformsVertex[index].matrixWorldInverse * objectMatrixWorld;
            var normalMatrix : mat3x3<f32>;
            normalMatrix = getNormalMatrix( modelViewMatrix );
            
            var instanceMatrix : mat4x4<f32>;
            var instanceTmp : mat3x3<f32>;
            var instancePosition : vec3<f32>;
            var instanceNormal : vec3<f32>;
            instancePosition = position;
            instanceNormal = normal;
            instanceMatrix = compose(  positionArray[index], quaternionArray[index], scaleArray[index]);
            instancePosition = ( instanceMatrix * vec4<f32>( instancePosition, 1.0 ) ).xyz;
            instanceTmp = mat3x3<f32>( instanceMatrix[ 0u ].xyz, instanceMatrix[ 1u ].xyz, instanceMatrix[ 2u ].xyz );
            instanceNormal = ( instanceTmp * ( instanceNormal / vec3<f32>( dot( instanceTmp[ 0u ], instanceTmp[ 0u ] ), dot( instanceTmp[ 1u ], instanceTmp[ 1u ] ), dot( instanceTmp[ 2u ], instanceTmp[ 2u ] ) ) ) );
            
            NodeVaryings.nodeVarying1 = ( normalMatrix * instanceNormal );
            NodeVaryings.index = index;
            
            NodeVaryings.Vertex = ( ( NodeUniformsVertex[index].projectionMatrix * modelViewMatrix ) * vec4<f32>(instancePosition, 1.0 ) );
            return NodeVaryings;
        }`
        
        let fragmentShader=`// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStructFragment {
            color : vec3<f32>,
            opacity : f32,
            
        };
        @binding( 1 ) @group( 0 )
        var<storage,read> NodeUniformsFragment : array<NodeUniformsStructFragment>;
        
        // codes
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        }
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>, 
            @location(2) @interpolate(flat) index:u32) -> @location( 0 ) vec4<f32> {
            // vars	
            var TransformedNormalView : vec3<f32>;
            var DiffuseColor : vec4<f32>;
            var nodeVar2 : vec4<f32>;
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            // flow
            // code
            TransformedNormalView = normalize( nodeVarying1 );
            TransformedNormalView = normalize( nodeVarying1 );
            DiffuseColor = vec4<f32>( NodeUniformsFragment[index].color, 1.0 );
            DiffuseColor.w = ( DiffuseColor.w * NodeUniformsFragment[index].opacity);
            nodeVar2 = vec4<f32>( DiffuseColor.xyz, DiffuseColor.w );
            // result
            return vec4<f32>( mix( ( ( pow( nodeVar2.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar2.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar2.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar2.w );
        }`
        return {vertexShader,fragmentShader}
    }
    
    getShadersTmp2(){
        let vertexShader = `// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStructVertex {
            projectionMatrix : mat4x4<f32>,
            matrixWorldInverse : mat4x4<f32>,
            sceneMatrixWorld : mat4x4<f32>,
            objectPosition : vec4<f32>,
            objectQuaternion : vec4<f32>,
            objectScale : vec4<f32>
        };
        @binding( 0 ) @group( 0 )
        var<storage,read> NodeUniformsVertex : array<NodeUniformsStructVertex>;
        @binding( 2 ) @group( 0 )
        var<storage,read> instanceMatrics : array<mat4x4<f32>>;
        
        // varyings
        struct NodeVaryingsStruct {
            @location( 1 ) nodeVarying1 : vec3<f32>,
            @location(2) @interpolate(flat) index : u32,
            @builtin( position ) Vertex : vec4<f32>
            
        };
        
    
        // 矩阵逆函数
        fn invert(mat : mat3x3<f32>) -> mat3x3<f32> {
            // 计算逆矩阵的算法
            var n11 : f32 = mat[0][0]; var n21 : f32 = mat[1][0]; var n31 : f32 = mat[2][0];
            var	n12 : f32 = mat[0][1]; var n22 : f32 = mat[1][1]; var n32 : f32 = mat[2][1];
            var	n13 : f32 = mat[0][2]; var n23 : f32 = mat[1][2]; var n33 : f32 = mat[2][2];
    
            var t11 : f32 = n33 * n22 - n32 * n23;
            var	t12 : f32 = n32 * n13 - n33 * n12;
            var	t13 : f32 = n23 * n12 - n22 * n13;
    
            var det : f32 = n11 * t11 + n21 * t12 + n31 * t13;
    
            // 如果行列式为0, 则逆矩阵不存在
            if (abs(det) < 0.00001) {
                // 返回一个全为0的矩阵表示逆矩阵不存在
                return mat3x3<f32>(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
            }
    
            var detInv : f32 = 1.0 / det;
    
            // 构建逆矩阵
            var inverseMat : mat3x3<f32> = mat3x3<f32>(
                t11 * detInv,  (n31 * n23 - n33 * n21) * detInv,  (n32 * n21 - n31 * n22) * detInv,
                t12 * detInv,  (n33 * n11 - n31 * n13) * detInv,  (n31 * n12 - n32 * n11) * detInv,
                t13 * detInv,  (n21 * n13 - n23 * n11) * detInv,  (n22 * n11 - n21 * n12) * detInv
            );
    
            return inverseMat;
        }
        // 获取normal matrix的函数实现
        fn transpose(inputMatrix : mat3x3<f32>) -> mat3x3<f32> {
            // 构建转置矩阵
            var transposeMat : mat3x3<f32> = mat3x3<f32>(
                inputMatrix[0][0], inputMatrix[1][0], inputMatrix[2][0],
                inputMatrix[0][1], inputMatrix[1][1], inputMatrix[2][1],
                inputMatrix[0][2], inputMatrix[1][2], inputMatrix[2][2]
            );
    
            return transposeMat;
        }
    
        
    
        // 获取normal matrix的函数实现
        fn getNormalMatrix(inputMatrix : mat4x4<f32>) -> mat3x3<f32> {
            // 提取inputMatrix的前三行三列
            var subMatrix : mat3x3<f32> = mat3x3<f32>(inputMatrix[0].xyz, inputMatrix[1].xyz, inputMatrix[2].xyz);
    
            // 计算该3x3子矩阵的逆矩阵
            var inverseMatrix : mat3x3<f32> = invert(subMatrix);
    
            // 计算该逆矩阵的转置矩阵
            var normalMatrix : mat3x3<f32> = transpose(inverseMatrix);
    
            return normalMatrix;
        }
    
        fn compose(position: vec4<f32>, quaternion: vec4<f32>, scale: vec4<f32>) -> mat4x4<f32> {
            var x : f32 = quaternion[0]; var y : f32 = quaternion[1]; var z : f32 = quaternion[2]; var w : f32 = quaternion[3];
    
            var x2 : f32 = x + x; var y2 : f32 = y + y; var z2 : f32 = z + z;
            var xx : f32 = x * x2; var xy : f32 = x * y2; var xz : f32 = x * z2;
            var yy : f32 = y * y2; var yz : f32 = y * z2; var zz : f32 = z * z2;
            var wx : f32 = w * x2; var wy : f32 = w * y2; var wz : f32 = w * z2;
    
            var sx : f32 = scale[0]; var sy : f32 = scale[1]; var sz : f32 = scale[2];
    
            // 设置矩阵的各个元素
            var te : mat4x4<f32> = mat4x4<f32>(
                (1.0 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0.0,
                (xy - wz) * sy, (1.0 - (xx + zz)) * sy, (yz + wx) * sy, 0.0,
                (xz + wy) * sz, (yz - wx) * sz, (1.0 - (xx + yy)) * sz, 0.0,
                position.x, position.y, position.z, 1.0
            );
            
    
            return te;
        }
    
        // codes
        @vertex
        fn main(  @builtin(instance_index) index : u32, @location( 0 ) position : vec3<f32>,
            @location( 1 ) normal : vec3<f32>) -> NodeVaryingsStruct {
            
            var NodeVaryings: NodeVaryingsStruct;
            var objectMatrix : mat4x4<f32>;
            objectMatrix = compose( NodeUniformsVertex[index].objectPosition, NodeUniformsVertex[index].objectQuaternion, NodeUniformsVertex[index].objectScale);
            var objectMatrixWorld : mat4x4<f32>;
            objectMatrixWorld = NodeUniformsVertex[index].sceneMatrixWorld * objectMatrix;
            var modelViewMatrix : mat4x4<f32>;
            modelViewMatrix = NodeUniformsVertex[index].matrixWorldInverse * objectMatrixWorld;
            var normalMatrix : mat3x3<f32>;
            normalMatrix = getNormalMatrix( modelViewMatrix );
            
            var instanceMatrix : mat4x4<f32>;
            var instanceTmp : mat3x3<f32>;
            var instancePosition : vec3<f32>;
            var instanceNormal : vec3<f32>;
            instancePosition = position;
            instanceNormal = normal;
            instanceMatrix = instanceMatrics[index];
            instancePosition = ( instanceMatrix * vec4<f32>( instancePosition, 1.0 ) ).xyz;
            instanceTmp = mat3x3<f32>( instanceMatrix[ 0u ].xyz, instanceMatrix[ 1u ].xyz, instanceMatrix[ 2u ].xyz );
            instanceNormal = ( instanceTmp * ( instanceNormal / vec3<f32>( dot( instanceTmp[ 0u ], instanceTmp[ 0u ] ), dot( instanceTmp[ 1u ], instanceTmp[ 1u ] ), dot( instanceTmp[ 2u ], instanceTmp[ 2u ] ) ) ) );
            
            NodeVaryings.nodeVarying1 = ( normalMatrix * instanceNormal );
            NodeVaryings.index = index;
            
            NodeVaryings.Vertex = ( ( NodeUniformsVertex[index].projectionMatrix * modelViewMatrix ) * vec4<f32>(instancePosition, 1.0 ) );
            return NodeVaryings;
        }`
        
        let fragmentShader=`// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStructFragment {
            color : vec3<f32>,
            opacity : f32,
            
        };
        @binding( 1 ) @group( 0 )
        var<storage,read> NodeUniformsFragment : array<NodeUniformsStructFragment>;
        
        // codes
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        }
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>, 
            @location(2) @interpolate(flat) index:u32) -> @location( 0 ) vec4<f32> {
            // vars	
            var TransformedNormalView : vec3<f32>;
            var DiffuseColor : vec4<f32>;
            var nodeVar2 : vec4<f32>;
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            // flow
            // code
            TransformedNormalView = normalize( nodeVarying1 );
            TransformedNormalView = normalize( nodeVarying1 );
            DiffuseColor = vec4<f32>( NodeUniformsFragment[index].color, 1.0 );
            DiffuseColor.w = ( DiffuseColor.w * NodeUniformsFragment[index].opacity);
            nodeVar2 = vec4<f32>( DiffuseColor.xyz, DiffuseColor.w );
            // result
            return vec4<f32>( mix( ( ( pow( nodeVar2.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar2.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar2.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar2.w );
        }`
        return {vertexShader,fragmentShader}
    }
    
    
    getShaders2(){
        let vertexShader = `// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform0 : mat3x3<f32>,
            nodeUniform3 : mat4x4<f32>,
            nodeUniform4 : mat4x4<f32>
        };
        @binding( 0 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        // varyings
        struct NodeVaryingsStruct {
            @location( 1 ) nodeVarying1 : vec3<f32>,
            @location(2) @interpolate(flat) index : u32,
            @builtin( position ) Vertex : vec4<f32>
            
        };
        
        // codes
        @vertex
        fn main(  @builtin(instance_index) index : u32, @location( 0 ) position : vec3<f32>,
            @location( 1 ) normal : vec3<f32>) -> NodeVaryingsStruct {
            // system
            var NodeVaryings: NodeVaryingsStruct;
            // vars
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            // flow
            // code
            nodeVarying0 = position;
            nodeVarying2 = normal;
            NodeVaryings.nodeVarying1 = ( NodeUniforms[index].nodeUniform0 * nodeVarying2 );
            NodeVaryings.index = index;
            // result
            NodeVaryings.Vertex = ( ( NodeUniforms[index].nodeUniform3 * NodeUniforms[index].nodeUniform4 ) * vec4<f32>( nodeVarying0, 1.0 ) );
            return NodeVaryings;
        }`
        
    
        let fragmentShader=`// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform1 : vec3<f32>,
            nodeUniform2 : f32,
            
        };
        @binding( 1 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        // codes
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        }
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>, 
            @location(2) @interpolate(flat) index:u32) -> @location( 0 ) vec4<f32> {
            // vars	
            var TransformedNormalView : vec3<f32>;
            var DiffuseColor : vec4<f32>;
            var nodeVar2 : vec4<f32>;
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            // flow
            // code
            TransformedNormalView = normalize( nodeVarying1 );
            DiffuseColor = vec4<f32>( NodeUniforms[index].nodeUniform1, 1.0 );
            DiffuseColor.w = ( DiffuseColor.w * NodeUniforms[index].nodeUniform2);
            nodeVar2 = vec4<f32>( DiffuseColor.xyz, DiffuseColor.w );
            // result
            return vec4<f32>( mix( ( ( pow( nodeVar2.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar2.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar2.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar2.w );
        }`
    
        
        return {vertexShader,fragmentShader}
    }
    
    
    getShadersTry(){
        console.log("getShaders")
        let vertexShader = `// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform0 : mat3x3<f32>,
            nodeUniform3 : mat4x4<f32>,
            nodeUniform4 : mat4x4<f32>
        };
        @binding( 0 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        // varyings
        struct NodeVaryingsStruct {
            @location( 1 ) nodeVarying1 : vec3<f32>,
            @location(3) nodeVarying3 : vec3<f32>,
            @location(4) nodeVarying4 : vec4<f32>,
            @location(5) nodeVarying5 : vec3<f32>,
            @location(2) @interpolate(flat) index : u32,
            @builtin( position ) Vertex : vec4<f32>
            
        };
        
        // codes
        @vertex
        fn main(  @builtin(instance_index) index : u32, @location( 0 ) position : vec3<f32>,
            @location( 1 ) normal : vec3<f32>) -> NodeVaryingsStruct {
            // system
            var NodeVaryings: NodeVaryingsStruct;
            // vars
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            var nodeVarying6 : vec4<f32>;
            // flow
            // code
            nodeVarying0 = position;
            nodeVarying2 = normal;
            NodeVaryings.nodeVarying1 = ( NodeUniforms[index].nodeUniform0 * nodeVarying2 );
            NodeVaryings.nodeVarying3 = normal;
            NodeVaryings.nodeVarying4 = ( NodeUniforms[index].nodeUniform3 * vec4<f32>( nodeVarying0, 1.0 ) );
            nodeVarying6 = ( NodeUniforms[index].nodeUniform3 * vec4<f32>( nodeVarying0, 1.0 ) );
            NodeVaryings.nodeVarying5 = -nodeVarying6.xyz;
            NodeVaryings.index = index;
            // result
            NodeVaryings.Vertex = ( ( NodeUniforms[index].nodeUniform3 * NodeUniforms[index].nodeUniform4 ) * vec4<f32>( nodeVarying0, 1.0 ) );
            return NodeVaryings;
        }`
        
    
        let fragmentShader=`// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform1 : vec3<f32>,
            nodeUniform2 : f32,
            
        };
        @binding( 1 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        // codes
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        }
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>, 
            @location(2) @interpolate(flat) index:u32,
            @location( 3 ) nodeVarying3 : vec3<f32>,
            @location( 4 ) nodeVarying4 : vec4<f32>,
            @location( 5 ) nodeVarying5 : vec3<f32>) -> @location( 0 ) vec4<f32> {
                // vars
    
            var TransformedNormalView : vec3<f32>;
            var DiffuseColor : vec4<f32>;
            var Metalness : f32;
            var Roughness : f32;
            var nodeVar4 : vec3<f32>;
            var SpecularColor : vec3<f32>;
            var nodeVar6 : vec3<f32>;
            var nodeVar7 : vec3<f32>;
            var nodeVar8 : f32;
            var nodeVar9 : vec3<f32>;
            var nodeVar10 : vec4<f32>;
            var nodeVar11 : vec2<f32>;
            var nodeVar12 : vec3<f32>;
            var nodeVar13 : vec3<f32>;
            var nodeVar14 : f32;
            var nodeVar15 : vec3<f32>;
            var nodeVar16 : vec3<f32>;
            var nodeVar17 : vec3<f32>;
            var nodeVar18 : f32;
            var nodeVar19 : vec3<f32>;
            var nodeVar20 : f32;
            var nodeVar21 : f32;
            var nodeVar22 : f32;
            var nodeVar23 : f32;
            var nodeVar24 : f32;
            var nodeVar25 : f32;
            var nodeVar26 : f32;
            var nodeVar27 : vec3<f32>;
            var nodeVar28 : vec4<f32>;
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            var nodeVarying6 : vec4<f32>;
        
        
            // flow
            // code
        
            TransformedNormalView = normalize( nodeVarying1 );
            TransformedNormalView = normalize( nodeVarying1 );
            DiffuseColor = vec4<f32>( NodeUniforms[index].nodeUniform1, 1.0 );
            DiffuseColor.w = ( DiffuseColor.w * NodeUniforms[index].nodeUniform2 );
            Metalness = 0.5;
            nodeVar4 = max( abs( dpdx( nodeVarying3 ) ), abs( dpdy( nodeVarying3 ) ) );
            Roughness = min( ( max( 0.05, 0.0525 ) + max( max( nodeVar4.x, nodeVar4.y ), nodeVar4.z ) ), 1.0 );
            SpecularColor = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz,0.5 );
            DiffuseColor = vec4<f32>( ( DiffuseColor.xyz * vec3<f32>( ( 1.0 -0.5 ) ) ), DiffuseColor.w );
            nodeVar6 = ( vec3<f32>(0.5,0.5,0.5) - nodeVarying4.xyz );
            nodeVar7 = normalize( nodeVar6 );
        
            if ( (0.5 > 0.0 ) ) {
        
                nodeVar8 = ( ( 1.0 / max( pow( length( nodeVar6 ), 0.5 ), 0.01 ) ) * pow( clamp( ( 1.0 - pow( ( length( nodeVar6 ) / 0.5 ), 4.0 ) ), 0.0, 1.0 ), 2.0 ) );
        
            } else {
        
                nodeVar8 = ( 1.0 / max( pow( length( nodeVar6 ), 0.5 ), 0.01 ) );
        
            }
        
            nodeVar9 = ( vec3<f32>( clamp( dot( TransformedNormalView, nodeVar7 ), 0.0, 1.0 ) ) * ( vec3<f32>(0.5,0.5,0.5) * vec3<f32>( nodeVar8 ) ) );
            nodeVar10 = ( ( vec4<f32>( vec3<f32>( Roughness ), 1.0 ) * vec4<f32>( -1.0, -0.0275, -0.572, 0.022 ) ) + vec4<f32>( 1.0, 0.0425, 1.04, -0.04 ) );
            nodeVar11 = ( ( vec2<f32>( -1.04, 1.04 ) * vec2<f32>( ( ( min( ( nodeVar10.x * nodeVar10.x ), exp2( ( clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 ) * -9.28 ) ) ) * nodeVar10.x ) + nodeVar10.y ) ) ) + nodeVar10.zw );
            nodeVar12 = ( ( SpecularColor * vec3<f32>( nodeVar11.x ) ) + vec3<f32>( ( 1.0 * nodeVar11.y ) ) );
            nodeVar13 = ( SpecularColor + ( ( vec3<f32>( 1.0 ) - SpecularColor ) * vec3<f32>( 0.047619 ) ) );
            nodeVar14 = ( 1.0 - ( nodeVar11.x + nodeVar11.y ) );
            nodeVar15 = ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + nodeVar12 ) + ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( ( ( nodeVar12 * nodeVar13 ) / ( vec3<f32>( 1.0 ) - ( vec3<f32>( nodeVar14 ) * nodeVar13 ) ) ) * vec3<f32>( nodeVar14 ) ) ) );
            nodeVar16 = vec3<f32>( 0.0, 0.0, 0.0 );
            nodeVar17 = ( nodeVar16 * vec3<f32>( 0.3183098861837907 ) );
            nodeVar18 = 1.0;
            nodeVar19 = normalize( ( nodeVar7 + normalize( nodeVarying5 ) ) );
            nodeVar20 = clamp( dot( normalize( nodeVarying5 ), nodeVar19 ), 0.0, 1.0 );
            nodeVar21 = exp2( ( ( ( nodeVar20 * -5.55473 ) - 6.98316 ) * nodeVar20 ) );
            nodeVar22 = clamp( dot( TransformedNormalView, nodeVar7 ), 0.0, 1.0 );
            nodeVar23 = pow( Roughness, 2.0 );
            nodeVar24 = pow( nodeVar23, 2.0 );
            nodeVar25 = clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 );
            nodeVar26 = pow( nodeVar23, 2.0 );
            nodeVar27 = vec3<f32>( 0.0, 0.0, 0.0 );
            nodeVar28 = vec4<f32>( ( ( ( vec4<f32>( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar9 * ( DiffuseColor.xyz * vec3<f32>( 0.3183098861837907 ) ) ) ), 1.0 ) + ( ( ( vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), 1.0 ) + ( vec4<f32>( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>(0.5,0.5,0.5) ), 1.0 ) * ( DiffuseColor * vec4<f32>( vec3<f32>( 0.3183098861837907 ), 1.0 ) ) ) ) + ( ( DiffuseColor * vec4<f32>( vec3<f32>( ( 1.0 - max( max( nodeVar15.x, nodeVar15.y ), nodeVar15.z ) ) ), 1.0 ) ) * vec4<f32>( nodeVar17, 1.0 ) ) ) * vec4<f32>( vec3<f32>( nodeVar18 ), 1.0 ) ) ) + vec4<f32>( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar9 * ( ( ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar21 ) ) ) + vec3<f32>( ( 1.0 * nodeVar21 ) ) ) * vec3<f32>( ( 0.5 / max( ( ( nodeVar22 * sqrt( ( nodeVar24 + ( ( 1.0 - nodeVar24 ) * pow( nodeVar25, 2.0 ) ) ) ) ) + ( nodeVar25 * sqrt( ( nodeVar24 + ( ( 1.0 - nodeVar24 ) * pow( nodeVar22, 2.0 ) ) ) ) ) ), 0.000001 ) ) ) ) * vec3<f32>( ( ( nodeVar26 / pow( ( 1.0 - ( pow( clamp( dot( TransformedNormalView, nodeVar19 ), 0.0, 1.0 ), 2.0 ) * ( 1.0 - nodeVar26 ) ) ), 2.0 ) ) * 0.3183098861837907 ) ) ) ) ) + ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar27 * ( vec3<f32>( 0.0, 0.0, 0.0 ) + nodeVar12 ) ) ) + ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( ( ( nodeVar12 * nodeVar13 ) / ( vec3<f32>( 1.0 ) - ( vec3<f32>( nodeVar14 ) * nodeVar13 ) ) ) * vec3<f32>( nodeVar14 ) ) ) * nodeVar17 ) ) * vec3<f32>( clamp( ( nodeVar18 - ( 1.0 - pow( ( clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 ) + nodeVar18 ), exp2( -( 1.0 - ( Roughness * -16.0 ) ) ) ) ) ), 0.0, 1.0 ) ) ) ), 1.0 ) ).xyz + vec3<f32>(0.5,0.5,0.5) ), DiffuseColor.w );
        
            // result
            return vec4<f32>( mix( ( ( pow( nodeVar28.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar28.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar28.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar28.w );
        
        }`
    
        
        return {vertexShader,fragmentShader}
    }
    
    getShadersFixedTry(){
        let vertexShader = `// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform0 : mat3x3<f32>,
            nodeUniform3 : mat4x4<f32>,
            nodeUniform4 : mat4x4<f32>
        };
        @binding( 0 ) @group( 0 )
        var<uniform> NodeUniforms : array<NodeUniformsStruct,372>;
        // varyings
        struct NodeVaryingsStruct {
            @location( 1 ) nodeVarying1 : vec3<f32>,
            @location(3) nodeVarying3 : vec3<f32>,
            @location(4) nodeVarying4 : vec4<f32>,
            @location(5) nodeVarying5 : vec3<f32>,
            @location(2) @interpolate(flat) index : u32,
            @builtin( position ) Vertex : vec4<f32>
            
        };
        
        // codes
        @vertex
        fn main(  @builtin(instance_index) index : u32, @location( 0 ) position : vec3<f32>,
            @location( 1 ) normal : vec3<f32>) -> NodeVaryingsStruct {
            // system
            var NodeVaryings: NodeVaryingsStruct;
            // vars
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            var nodeVarying6 : vec4<f32>;
            // flow
            // code
            nodeVarying0 = position;
            nodeVarying2 = normal;
            NodeVaryings.nodeVarying1 = ( NodeUniforms[index].nodeUniform0 * nodeVarying2 );
            NodeVaryings.nodeVarying3 = normal;
            NodeVaryings.nodeVarying4 = ( NodeUniforms[index].nodeUniform3 * vec4<f32>( nodeVarying0, 1.0 ) );
            nodeVarying6 = ( NodeUniforms[index].nodeUniform3 * vec4<f32>( nodeVarying0, 1.0 ) );
            NodeVaryings.nodeVarying5 = -nodeVarying6.xyz;
            NodeVaryings.index = index;
            // result
            NodeVaryings.Vertex = ( ( NodeUniforms[index].nodeUniform3 * NodeUniforms[index].nodeUniform4 ) * vec4<f32>( nodeVarying0, 1.0 ) );
            return NodeVaryings;
        }`
        
    
        let fragmentShader=`// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform1 : vec3<f32>,
            nodeUniform2 : f32,
            
        };
        @binding( 1 ) @group( 0 )
        var<uniform> NodeUniforms : array<NodeUniformsStruct,372>;
        // codes
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        }
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>, 
            @location(2) @interpolate(flat) index:u32,
            @location( 3 ) nodeVarying3 : vec3<f32>,
            @location( 4 ) nodeVarying4 : vec4<f32>,
            @location( 5 ) nodeVarying5 : vec3<f32>) -> @location( 0 ) vec4<f32> {
                // vars
    
            var TransformedNormalView : vec3<f32>;
            var DiffuseColor : vec4<f32>;
            var Metalness : f32;
            var Roughness : f32;
            var nodeVar4 : vec3<f32>;
            var SpecularColor : vec3<f32>;
            var nodeVar6 : vec3<f32>;
            var nodeVar7 : vec3<f32>;
            var nodeVar8 : f32;
            var nodeVar9 : vec3<f32>;
            var nodeVar10 : vec4<f32>;
            var nodeVar11 : vec2<f32>;
            var nodeVar12 : vec3<f32>;
            var nodeVar13 : vec3<f32>;
            var nodeVar14 : f32;
            var nodeVar15 : vec3<f32>;
            var nodeVar16 : vec3<f32>;
            var nodeVar17 : vec3<f32>;
            var nodeVar18 : f32;
            var nodeVar19 : vec3<f32>;
            var nodeVar20 : f32;
            var nodeVar21 : f32;
            var nodeVar22 : f32;
            var nodeVar23 : f32;
            var nodeVar24 : f32;
            var nodeVar25 : f32;
            var nodeVar26 : f32;
            var nodeVar27 : vec3<f32>;
            var nodeVar28 : vec4<f32>;
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            var nodeVarying6 : vec4<f32>;
        
        
            // flow
            // code
        
            TransformedNormalView = normalize( nodeVarying1 );
            TransformedNormalView = normalize( nodeVarying1 );
            DiffuseColor = vec4<f32>( NodeUniforms[index].nodeUniform1, 1.0 );
            DiffuseColor.w = ( DiffuseColor.w * NodeUniforms[index].nodeUniform2 );
            Metalness = 0.5;
            nodeVar4 = max( abs( dpdx( nodeVarying3 ) ), abs( dpdy( nodeVarying3 ) ) );
            Roughness = min( ( max( 0.05, 0.0525 ) + max( max( nodeVar4.x, nodeVar4.y ), nodeVar4.z ) ), 1.0 );
            SpecularColor = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz,0.5 );
            DiffuseColor = vec4<f32>( ( DiffuseColor.xyz * vec3<f32>( ( 1.0 -0.5 ) ) ), DiffuseColor.w );
            nodeVar6 = ( vec3<f32>(0.5,0.5,0.5) - nodeVarying4.xyz );
            nodeVar7 = normalize( nodeVar6 );
        
            if ( (0.5 > 0.0 ) ) {
        
                nodeVar8 = ( ( 1.0 / max( pow( length( nodeVar6 ), 0.5 ), 0.01 ) ) * pow( clamp( ( 1.0 - pow( ( length( nodeVar6 ) / 0.5 ), 4.0 ) ), 0.0, 1.0 ), 2.0 ) );
        
            } else {
        
                nodeVar8 = ( 1.0 / max( pow( length( nodeVar6 ), 0.5 ), 0.01 ) );
        
            }
        
            nodeVar9 = ( vec3<f32>( clamp( dot( TransformedNormalView, nodeVar7 ), 0.0, 1.0 ) ) * ( vec3<f32>(0.5,0.5,0.5) * vec3<f32>( nodeVar8 ) ) );
            nodeVar10 = ( ( vec4<f32>( vec3<f32>( Roughness ), 1.0 ) * vec4<f32>( -1.0, -0.0275, -0.572, 0.022 ) ) + vec4<f32>( 1.0, 0.0425, 1.04, -0.04 ) );
            nodeVar11 = ( ( vec2<f32>( -1.04, 1.04 ) * vec2<f32>( ( ( min( ( nodeVar10.x * nodeVar10.x ), exp2( ( clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 ) * -9.28 ) ) ) * nodeVar10.x ) + nodeVar10.y ) ) ) + nodeVar10.zw );
            nodeVar12 = ( ( SpecularColor * vec3<f32>( nodeVar11.x ) ) + vec3<f32>( ( 1.0 * nodeVar11.y ) ) );
            nodeVar13 = ( SpecularColor + ( ( vec3<f32>( 1.0 ) - SpecularColor ) * vec3<f32>( 0.047619 ) ) );
            nodeVar14 = ( 1.0 - ( nodeVar11.x + nodeVar11.y ) );
            nodeVar15 = ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + nodeVar12 ) + ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( ( ( nodeVar12 * nodeVar13 ) / ( vec3<f32>( 1.0 ) - ( vec3<f32>( nodeVar14 ) * nodeVar13 ) ) ) * vec3<f32>( nodeVar14 ) ) ) );
            nodeVar16 = vec3<f32>( 0.0, 0.0, 0.0 );
            nodeVar17 = ( nodeVar16 * vec3<f32>( 0.3183098861837907 ) );
            nodeVar18 = 1.0;
            nodeVar19 = normalize( ( nodeVar7 + normalize( nodeVarying5 ) ) );
            nodeVar20 = clamp( dot( normalize( nodeVarying5 ), nodeVar19 ), 0.0, 1.0 );
            nodeVar21 = exp2( ( ( ( nodeVar20 * -5.55473 ) - 6.98316 ) * nodeVar20 ) );
            nodeVar22 = clamp( dot( TransformedNormalView, nodeVar7 ), 0.0, 1.0 );
            nodeVar23 = pow( Roughness, 2.0 );
            nodeVar24 = pow( nodeVar23, 2.0 );
            nodeVar25 = clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 );
            nodeVar26 = pow( nodeVar23, 2.0 );
            nodeVar27 = vec3<f32>( 0.0, 0.0, 0.0 );
            nodeVar28 = vec4<f32>( ( ( ( vec4<f32>( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar9 * ( DiffuseColor.xyz * vec3<f32>( 0.3183098861837907 ) ) ) ), 1.0 ) + ( ( ( vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), 1.0 ) + ( vec4<f32>( ( vec3<f32>( 0.0, 0.0, 0.0 ) + vec3<f32>(0.5,0.5,0.5) ), 1.0 ) * ( DiffuseColor * vec4<f32>( vec3<f32>( 0.3183098861837907 ), 1.0 ) ) ) ) + ( ( DiffuseColor * vec4<f32>( vec3<f32>( ( 1.0 - max( max( nodeVar15.x, nodeVar15.y ), nodeVar15.z ) ) ), 1.0 ) ) * vec4<f32>( nodeVar17, 1.0 ) ) ) * vec4<f32>( vec3<f32>( nodeVar18 ), 1.0 ) ) ) + vec4<f32>( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar9 * ( ( ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar21 ) ) ) + vec3<f32>( ( 1.0 * nodeVar21 ) ) ) * vec3<f32>( ( 0.5 / max( ( ( nodeVar22 * sqrt( ( nodeVar24 + ( ( 1.0 - nodeVar24 ) * pow( nodeVar25, 2.0 ) ) ) ) ) + ( nodeVar25 * sqrt( ( nodeVar24 + ( ( 1.0 - nodeVar24 ) * pow( nodeVar22, 2.0 ) ) ) ) ) ), 0.000001 ) ) ) ) * vec3<f32>( ( ( nodeVar26 / pow( ( 1.0 - ( pow( clamp( dot( TransformedNormalView, nodeVar19 ), 0.0, 1.0 ), 2.0 ) * ( 1.0 - nodeVar26 ) ) ), 2.0 ) ) * 0.3183098861837907 ) ) ) ) ) + ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar27 * ( vec3<f32>( 0.0, 0.0, 0.0 ) + nodeVar12 ) ) ) + ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( ( ( nodeVar12 * nodeVar13 ) / ( vec3<f32>( 1.0 ) - ( vec3<f32>( nodeVar14 ) * nodeVar13 ) ) ) * vec3<f32>( nodeVar14 ) ) ) * nodeVar17 ) ) * vec3<f32>( clamp( ( nodeVar18 - ( 1.0 - pow( ( clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 ) + nodeVar18 ), exp2( -( 1.0 - ( Roughness * -16.0 ) ) ) ) ) ), 0.0, 1.0 ) ) ) ), 1.0 ) ).xyz + vec3<f32>(0.5,0.5,0.5) ), DiffuseColor.w );
        
            // result
            return vec4<f32>( mix( ( ( pow( nodeVar28.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar28.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar28.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar28.w );
        
        }`
    
        
        return {vertexShader,fragmentShader}
    }
    
    
    getShaders2Instance(){
        console.log('instance')
        let vertexShader = `// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform0 : mat3x3<f32>,
            nodeUniform3 : mat4x4<f32>,
            nodeUniform4 : mat4x4<f32>
        };
        @binding( 0 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        @binding( 2 ) @group( 0 )
        var<storage,read> instanceMatrics : array<mat4x4<f32>>;
        // varyings
        struct NodeVaryingsStruct {
            @location( 1 ) nodeVarying1 : vec3<f32>,
            @location(2) @interpolate(flat) index : u32,
            @builtin( position ) Vertex : vec4<f32>
            
        };
        
        // codes
        @vertex
        fn main(  @builtin(instance_index) index : u32, @location( 0 ) position : vec3<f32>,
            @location( 1 ) normal : vec3<f32>) -> NodeVaryingsStruct {
            // system
            var NodeVaryings: NodeVaryingsStruct;
                
            var instanceMatrix : mat4x4<f32>;
            var instanceTmp : mat3x3<f32>;
            var instancePosition : vec3<f32>;
            var instanceNormal : vec3<f32>;
            instancePosition = position;
            instanceNormal = normal;
            instanceMatrix = instanceMatrics[index];
            instancePosition = ( instanceMatrix * vec4<f32>( instancePosition, 1.0 ) ).xyz;
            instanceTmp = mat3x3<f32>( instanceMatrix[ 0u ].xyz, instanceMatrix[ 1u ].xyz, instanceMatrix[ 2u ].xyz );
            instanceNormal = ( instanceTmp * ( instanceNormal / vec3<f32>( dot( instanceTmp[ 0u ], instanceTmp[ 0u ] ), dot( instanceTmp[ 1u ], instanceTmp[ 1u ] ), dot( instanceTmp[ 2u ], instanceTmp[ 2u ] ) ) ) );
            
            NodeVaryings.nodeVarying1 = ( NodeUniforms[index].nodeUniform0 * instanceNormal );
            NodeVaryings.index = index;
            // result
            NodeVaryings.Vertex = ( ( NodeUniforms[index].nodeUniform3 * NodeUniforms[index].nodeUniform4 ) * vec4<f32>( instancePosition, 1.0 ) );
            return NodeVaryings;
        }`
        
        let fragmentShader=`// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform1 : vec3<f32>,
            nodeUniform2 : f32,
            
        };
        @binding( 1 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        // codes
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        }
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>, 
            @location(2) @interpolate(flat) index:u32) -> @location( 0 ) vec4<f32> {
            // vars	
            var TransformedNormalView : vec3<f32>;
            var DiffuseColor : vec4<f32>;
            var nodeVar2 : vec4<f32>;
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            // flow
            // code
            TransformedNormalView = normalize( nodeVarying1 );
            TransformedNormalView = normalize( nodeVarying1 );
            DiffuseColor = vec4<f32>( NodeUniforms[index].nodeUniform1, 1.0 );
            DiffuseColor.w = ( DiffuseColor.w * NodeUniforms[index].nodeUniform2);
            nodeVar2 = vec4<f32>( DiffuseColor.xyz, DiffuseColor.w );
            // result
            return vec4<f32>( mix( ( ( pow( nodeVar2.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar2.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar2.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar2.w );
        }`
        return {vertexShader,fragmentShader}
    }
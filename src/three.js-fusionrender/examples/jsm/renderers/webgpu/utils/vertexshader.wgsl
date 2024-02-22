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
            @location( 3 ) nodeVarying3 : vec3<f32>,
            @location( 4 ) nodeVarying4 : vec4<f32>,
            @location( 5 ) nodeVarying5 : vec3<f32>,
            @builtin( position ) Vertex : vec4<f32>,
            @location(2) @interpolate(flat) index : u32
        };
        
        // codes
        
        
        @vertex
        fn main( @location( 0 ) position : vec3<f32>,
            @location( 1 ) normal : vec3<f32>,
            @builtin(instance_index) index : u32, ) -> NodeVaryingsStruct {
        
            // system
            var NodeVaryings: NodeVaryingsStruct;
        
            // vars
            
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            var nodeVarying5 : vec4<f32>;
        
        
            // flow
            // code
        
            nodeVarying0 = position;
            nodeVarying2 = normal;
            NodeVaryings.nodeVarying1 = ( NodeUniforms[index].nodeUniform0 * nodeVarying2 );
            NodeVaryings.nodeVarying3 = normal;
            NodeVaryings.nodeVarying4 = ( NodeUniforms[index].nodeUniform4 * vec4<f32>( nodeVarying0, 1.0 ) );
            nodeVarying5 = ( NodeUniforms[index].nodeUniform4 * vec4<f32>( nodeVarying0, 1.0 ) );
            NodeVaryings.nodeVarying5 = -nodeVarying5.xyz;
            NodeVaryings.index = index;
            // result
            NodeVaryings.Vertex = ( ( NodeUniforms[index].nodeUniform3 * NodeUniforms[index].nodeUniform4 ) * vec4<f32>( nodeVarying0, 1.0 ) );
        
            return NodeVaryings;
        
        }

export class ShadersUtils{
    getShadersFixed(shaderType,limit,useUniform,useSplit,lightsList){
       
        const isStandrad = shaderType==='MeshStandardMaterial';
        console.log('getshader',isStandrad)
        let PointLightExist = false;
        let AmbientLightExist = false;
        for(const light of lightsList){
            const lightType = light.type;
            if(lightType==='PointLight'){
                PointLightExist = true;
            }else if(lightType==='AmbientLight'){
                AmbientLightExist = true;
            }
        }
        
        let vertexShader = `// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform0 : mat3x3<f32>,
            nodeUniform3 : mat4x4<f32>,
            nodeUniform4 : mat4x4<f32>
        };`
        if(useUniform){
            vertexShader+=`@binding( 0 ) @group( 0 )
            var<uniform> NodeUniforms : array<NodeUniformsStruct,`+limit+`>;\n`
        }else if(useSplit){
            vertexShader+=`@binding( 0 ) @group( 0 )
            var<storage,read> NodeUniforms : array<NodeUniformsStruct,`+limit+`>;\n`
        }else{
            vertexShader+=`@binding( 0 ) @group( 0 )
            var<storage,read> NodeUniforms : array<NodeUniformsStruct>;\n`
        }
      
        vertexShader+=`// varyings
        struct NodeVaryingsStruct {
            @location( 1 ) nodeVarying1 : vec3<f32>,\n`
        if(isStandrad){
            vertexShader+=`@location( 3 ) nodeVarying3 : vec3<f32>,\n`
            if(PointLightExist){
                vertexShader+=`@location( 4 ) nodeVarying4 : vec4<f32>,
                @location( 5 ) nodeVarying5 : vec3<f32>,\n`
            }else if(AmbientLightExist){
                vertexShader+=`@location( 5 ) nodeVarying5 : vec3<f32>,\n`
            }
        }
        vertexShader+=
            `@location(2) @interpolate(flat) index : u32,
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
            var nodeVarying2 : vec3<f32>;\n`
        if(isStandrad && (PointLightExist||AmbientLightExist)){
            vertexShader+=`var nodeVarying5 : vec4<f32>;\n`;
        }
            
        vertexShader+=`// flow
            // code
            nodeVarying0 = position;
            nodeVarying2 = normal;
            NodeVaryings.nodeVarying1 = ( NodeUniforms[index].nodeUniform0 * nodeVarying2 );\n`
        if(isStandrad){
            vertexShader+=`NodeVaryings.nodeVarying3 = normal;\n`
            if(PointLightExist){
                vertexShader+=`NodeVaryings.nodeVarying4 = ( NodeUniforms[index].nodeUniform4 * vec4<f32>( nodeVarying0, 1.0 ) );\n`
            }
            if(PointLightExist||AmbientLightExist){
                vertexShader+=`nodeVarying5 = ( NodeUniforms[index].nodeUniform4 * vec4<f32>( nodeVarying0, 1.0 ) );
	            NodeVaryings.nodeVarying5 = -nodeVarying5.xyz;\n`
            }
        }
        vertexShader+=`NodeVaryings.index = index;
            // result
            NodeVaryings.Vertex = ( ( NodeUniforms[index].nodeUniform3 * NodeUniforms[index].nodeUniform4 ) * vec4<f32>( nodeVarying0, 1.0 ) );
            return NodeVaryings;
        }`
        
        let lightIndex=0;
        let pointLightIndices = [];
        let ambientLightIndices = [];
        let fragmentShader=`// Three.js r153 - NodeMaterial System
        // uniforms
        struct NodeUniformsStruct {
            nodeUniform1 : vec3<f32>,
            nodeUniform2 : f32,`
        if(isStandrad){
            fragmentShader+=`nodeUniform3 : f32,
            nodeUniform4 : f32,\n`
            for(const light of lightsList){
                const lightType = light.type;
                if(lightType==='AmbientLight'){
                    fragmentShader+=`ambientColor`+lightIndex+` : vec3<f32>,\n`;
                    ambientLightIndices.push(lightIndex);
                }else if(lightType==='PointLight'){
                    fragmentShader+=`position`+lightIndex+` : vec3<f32>,\n`;
                    fragmentShader+=`distance`+lightIndex+` : f32,\n`;
                    fragmentShader+=`pointColor`+lightIndex+` : vec3<f32>,\n`;
                    fragmentShader+=`decay`+lightIndex+` : f32,\n`;
                    pointLightIndices.push(lightIndex);
                }
                lightIndex++;
            }
            fragmentShader+=`nodeUniform5 : vec3<f32>,\n`
        }
        fragmentShader+=`};\n`
        if(useUniform){
            fragmentShader+= `@binding( 1 ) @group( 0 )
            var<uniform> NodeUniforms : array<NodeUniformsStruct,`+limit+`>;\n`
        }else if(useSplit){
            fragmentShader+= `@binding( 1 ) @group( 0 )
            var<storage,read> NodeUniforms : array<NodeUniformsStruct,`+limit+`>;\n`
        }else{
            fragmentShader+=`@binding( 1 ) @group( 0 )
            var<storage,read> NodeUniforms : array<NodeUniformsStruct>;\n`
        }
       
        
        fragmentShader+=`// codes
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        }
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>,` ;
        if(isStandrad){
            fragmentShader+=`@location( 3 ) nodeVarying3 : vec3<f32>,`;
            if(PointLightExist){
                fragmentShader+=`@location( 4 ) nodeVarying4 : vec4<f32>,`;
            }
            if(PointLightExist||AmbientLightExist){
                fragmentShader+=`@location( 5 ) nodeVarying5 : vec3<f32>,`;
            }
        }
        fragmentShader+=
            `@location(2) @interpolate(flat) index:u32) -> @location( 0 ) vec4<f32> {
            // vars	
            var TransformedNormalView : vec3<f32>;
            var DiffuseColor : vec4<f32>;\n`
        if(isStandrad){
            fragmentShader+=
            `var Metalness : f32;
            var Roughness : f32;
            var nodeVar4 : vec3<f32>;
            var SpecularColor : vec3<f32>;\n`
            if(PointLightExist){
                for(const pointLightIndex of pointLightIndices){
                    fragmentShader+=
                    `var point`+pointLightIndex+`Var0 : vec3<f32>;
                    var point`+pointLightIndex+`Var1 : vec3<f32>;
                    var point`+pointLightIndex+`Var2 : f32;
                    var point`+pointLightIndex+`Var3 : vec3<f32>;\n`
                    fragmentShader+=
                    `var point`+pointLightIndex+`Var4 : vec3<f32>;
                    var point`+pointLightIndex+`Var5 : f32;
                    var point`+pointLightIndex+`Var6 : f32;
                    var point`+pointLightIndex+`Var7 : f32;
                    var point`+pointLightIndex+`Var9 : f32;
                    var point`+pointLightIndex+`Var10 : f32;\n`
                    
                }
            }
        }
        fragmentShader+=
            `var nodeVar2 : vec4<f32>;
            var nodeVarying0 : vec3<f32>;
            var nodeVarying2 : vec3<f32>;
            // flow
            // code
            TransformedNormalView = normalize( nodeVarying1 );
            DiffuseColor = vec4<f32>( NodeUniforms[index].nodeUniform1, 1.0 );
            DiffuseColor.w = ( DiffuseColor.w * NodeUniforms[index].nodeUniform2);\n`
        if(isStandrad){
            fragmentShader+=
            `nodeVar4 = max( abs( dpdx( nodeVarying3 ) ), abs( dpdy( nodeVarying3 ) ) );
            Roughness = min( ( max( NodeUniforms[index].nodeUniform4, 0.0525 ) + max( max( nodeVar4.x, nodeVar4.y ), nodeVar4.z ) ), 1.0 );
            SpecularColor = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, NodeUniforms[index].nodeUniform3 );
            DiffuseColor = vec4<f32>( ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - NodeUniforms[index].nodeUniform3 ) ) ), DiffuseColor.w );\n`;
            if(PointLightExist){
                for(const pointLightIndex of pointLightIndices){
                    fragmentShader+=`point`+pointLightIndex+`Var0 = ( NodeUniforms[index].position`+pointLightIndex+` - nodeVarying4.xyz );\n`
                    fragmentShader+=`point`+pointLightIndex+`Var1 = normalize( `+`point`+pointLightIndex+`Var0 );\n` 
                    fragmentShader+=`if ( ( NodeUniforms[index].distance`+pointLightIndex+` > 0.0 ) ) {\n`    
                        fragmentShader+=`point`+pointLightIndex+`Var2 = ( ( 1.0 / max( pow( length( point`+pointLightIndex+`Var0 ), NodeUniforms[index].decay`+pointLightIndex+` ), 0.01 ) ) * pow( clamp( ( 1.0 - pow( ( length( point`+pointLightIndex+`Var0 ) / NodeUniforms[index].distance`+pointLightIndex+` ), 4.0 ) ), 0.0, 1.0 ), 2.0 ) );\n`          
                    fragmentShader+=`} else {\n`
                        fragmentShader+=`point`+pointLightIndex+`Var2 = ( 1.0 / max( pow( length( point`+pointLightIndex+`Var0 ), NodeUniforms[index].decay`+pointLightIndex+` ), 0.01 ) );\n`
                    fragmentShader+=`}\n`
                    fragmentShader+=`point`+pointLightIndex+`Var7 = clamp( dot( TransformedNormalView, point`+pointLightIndex+`Var1 ), 0.0, 1.0 );\n`
                    fragmentShader+=`point`+pointLightIndex+`Var3 = ( vec3<f32>( point`+pointLightIndex+`Var7 ) * ( NodeUniforms[index].pointColor`+pointLightIndex+` * vec3<f32>( point`+pointLightIndex+`Var2 ) ) );\n`
                    fragmentShader+=`point`+pointLightIndex+`Var4 = normalize( ( point`+pointLightIndex+`Var1 + normalize( nodeVarying5 ) ) );\n`
                    fragmentShader+=`point`+pointLightIndex+`Var5 = clamp( dot( normalize( nodeVarying5 ), point`+pointLightIndex+`Var4 ), 0.0, 1.0 );\n`
                    fragmentShader+=`point`+pointLightIndex+`Var6 = exp2( ( ( ( point`+pointLightIndex+`Var5 * -5.55473 ) - 6.98316 ) * point`+pointLightIndex+`Var5 ) );\n`                  
                    fragmentShader+=`point`+pointLightIndex+`Var9 = pow( Roughness, 4.0 );\n`
                    fragmentShader+=`point`+pointLightIndex+`Var10 = clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 );\n`
                  
                }
               
            }
            if(PointLightExist||AmbientLightExist){
                fragmentShader+=`nodeVar2 = vec4<f32>((`//0
                fragmentShader+=`(`;//1
                fragmentShader+=`(`;//qian
            }
            if(PointLightExist){
                fragmentShader+=`vec4<f32>((`;//10
               
                let first = true;
                for(const pointLightIndex of pointLightIndices){
                    if(first){
                        first=false;
                    }else{
                        fragmentShader+='+';
                    }
                    fragmentShader+=  ` point`+pointLightIndex+`Var3 * ( DiffuseColor.xyz * vec3<f32>( 0.3183098861837907 ) ) ` 
                }
                fragmentShader+=`),1.0)`;//10
            }
            if(PointLightExist||AmbientLightExist){
                if(PointLightExist){
                    fragmentShader+='+'
                }
                fragmentShader+=`  (`;//2
               
                fragmentShader+=`vec4<f32>(`//6
                fragmentShader+=  `( `
                let first=true;
                for(const ambientLightIndex in ambientLightIndices){
                    if(first){
                        first=false;
                    }else{
                        fragmentShader+='+';
                    }
                    fragmentShader+=` NodeUniforms[index].ambientColor`+ambientLightIndex;
                }
                fragmentShader+=`)`
                fragmentShader+=`, 1.0 ) `//6
                fragmentShader+=` * ( DiffuseColor * vec4<f32>( vec3<f32>( 0.3183098861837907 ), 1.0 ) ) `
              
                fragmentShader+=` ) `//2
                fragmentShader+=`)`;//qian
                fragmentShader+=`+ vec4<f32>( (`//hou
            }
            if(PointLightExist){
                // fragmentShader+=`vec3<f32>( 0.0, 0.0, 0.0 ) `;
                let first=true;
                for(const pointLightIndex of pointLightIndices){
                    if(first){
                        first=false;
                    }else{
                        fragmentShader+=`+`;
                    }
                    fragmentShader+=`( point`+pointLightIndex+`Var3 * ( ( ( ( SpecularColor * vec3<f32>( ( 1.0 - point`+pointLightIndex+`Var6 ) ) ) + vec3<f32>( point`+pointLightIndex+`Var6  ) ) * vec3<f32>( ( 0.5 / max( ( ( point`+pointLightIndex+`Var7 * sqrt( ( point`+pointLightIndex+`Var9 + ( ( 1.0 - point`+pointLightIndex+`Var9 ) * pow( point`+pointLightIndex+`Var10, 2.0 ) ) ) ) ) + ( point`+pointLightIndex+`Var10 * sqrt( ( point`+pointLightIndex+`Var9 + ( ( 1.0 - point`+pointLightIndex+`Var9 ) * pow( point`+pointLightIndex+`Var7, 2.0 ) ) ) ) ) ), 0.000001 ) ) ) ) * vec3<f32>( ( ( point`+pointLightIndex+`Var9 / pow( ( 1.0 - ( pow( clamp( dot( TransformedNormalView, point`+pointLightIndex+`Var4 ), 0.0, 1.0 ), 2.0 ) * ( 1.0 - point`+pointLightIndex+`Var9 ) ) ), 2.0 ) ) * 0.3183098861837907 ) ) ) ) `
                }
            }
            if(PointLightExist||AmbientLightExist){
                if(!PointLightExist){
                    fragmentShader+=`vec3<f32>(0,0,0)`
                }
               
            }
            if(PointLightExist||AmbientLightExist){
                fragmentShader+=`), 1.0 )`//hou
                fragmentShader+=`).xyz`//1
                fragmentShader+=`+ NodeUniforms[index].nodeUniform5 `
                fragmentShader+=`), DiffuseColor.w );\n`//0
            }
            if(!PointLightExist&&!AmbientLightExist){
                fragmentShader+=`nodeVar2 = vec4<f32>( ( DiffuseColor.xyz + NodeUniforms[index].nodeUniform5 ), DiffuseColor.w );\n`;
            }
        }else{
            fragmentShader+=
            `nodeVar2 = vec4<f32>( DiffuseColor.xyz, DiffuseColor.w );\n`
        }
        fragmentShader+=
            `// result
            return vec4<f32>( mix( ( ( pow( nodeVar2.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar2.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar2.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar2.w );
        }`
    
        console.log(vertexShader,fragmentShader)
      
        return {vertexShader,fragmentShader}
    }
  
}


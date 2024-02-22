`// uniforms

        struct NodeUniformsStruct {
            nodeUniform1 : vec3<f32>,
            nodeUniform2 : f32,
            nodeUniform3 : f32,
            nodeUniform4 : f32,
            nodeUniform5 : vec3<f32>,
            nodeUniform7 : vec3<f32>,
            nodeUniform8 : f32,
            nodeUniform9 : f32,
            nodeUniform10 : vec3<f32>,
            nodeUniform11 : vec3<f32>
        };
        @binding( 1 ) @group( 0 )
        var<storage,read> NodeUniforms : array<NodeUniformsStruct>;
        
        // codes
        
        fn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {
        
            return vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );
        
        }
        
        
        
        @fragment
        fn main( @location( 1 ) nodeVarying1 : vec3<f32>,
            @location( 3 ) nodeVarying3 : vec3<f32>,
            @location( 4 ) nodeVarying4 : vec4<f32>,
            @location( 5 ) nodeVarying5 : vec3<f32>,
            @location(2) @interpolate(flat) index:u32 ) -> @location( 0 ) vec4<f32> {
        
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
            Metalness = NodeUniforms[index].nodeUniform3;
            nodeVar4 = max( abs( dpdx( nodeVarying3 ) ), abs( dpdy( nodeVarying3 ) ) );
            Roughness = min( ( max( NodeUniforms[index].nodeUniform4, 0.0525 ) + max( max( nodeVar4.x, nodeVar4.y ), nodeVar4.z ) ), 1.0 );
            SpecularColor = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, NodeUniforms[index].nodeUniform3 );
            DiffuseColor = vec4<f32>( ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - NodeUniforms[index].nodeUniform3 ) ) ), DiffuseColor.w );
            nodeVar6 = ( NodeUniforms[index].nodeUniform5 - nodeVarying4.xyz );
            nodeVar7 = normalize( nodeVar6 );
        
            if ( ( NodeUniforms[index].nodeUniform8 > 0.0 ) ) {
        
                nodeVar8 = ( ( 1.0 / max( pow( length( nodeVar6 ), NodeUniforms[index].nodeUniform9 ), 0.01 ) ) * pow( clamp( ( 1.0 - pow( ( length( nodeVar6 ) / NodeUniforms[index].nodeUniform8 ), 4.0 ) ), 0.0, 1.0 ), 2.0 ) );
        
            } else {
        
                nodeVar8 = ( 1.0 / max( pow( length( nodeVar6 ), NodeUniforms[index].nodeUniform9 ), 0.01 ) );
        
            }
        
            nodeVar9 = ( vec3<f32>( clamp( dot( TransformedNormalView, nodeVar7 ), 0.0, 1.0 ) ) * ( NodeUniforms[index].nodeUniform7 * vec3<f32>( nodeVar8 ) ) );
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
            nodeVar28 = vec4<f32>( ( ( ( vec4<f32>( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar9 * ( DiffuseColor.xyz * vec3<f32>( 0.3183098861837907 ) ) ) ), 1.0 ) + ( ( ( vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), 1.0 ) + ( vec4<f32>( ( vec3<f32>( 0.0, 0.0, 0.0 ) + NodeUniforms[index].nodeUniform10 ), 1.0 ) * ( DiffuseColor * vec4<f32>( vec3<f32>( 0.3183098861837907 ), 1.0 ) ) ) ) + ( ( DiffuseColor * vec4<f32>( vec3<f32>( ( 1.0 - max( max( nodeVar15.x, nodeVar15.y ), nodeVar15.z ) ) ), 1.0 ) ) * vec4<f32>( nodeVar17, 1.0 ) ) ) * vec4<f32>( vec3<f32>( nodeVar18 ), 1.0 ) ) ) + vec4<f32>( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar9 * ( ( ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar21 ) ) ) + vec3<f32>( ( 1.0 * nodeVar21 ) ) ) * vec3<f32>( ( 0.5 / max( ( ( nodeVar22 * sqrt( ( nodeVar24 + ( ( 1.0 - nodeVar24 ) * pow( nodeVar25, 2.0 ) ) ) ) ) + ( nodeVar25 * sqrt( ( nodeVar24 + ( ( 1.0 - nodeVar24 ) * pow( nodeVar22, 2.0 ) ) ) ) ) ), 0.000001 ) ) ) ) * vec3<f32>( ( ( nodeVar26 / pow( ( 1.0 - ( pow( clamp( dot( TransformedNormalView, nodeVar19 ), 0.0, 1.0 ), 2.0 ) * ( 1.0 - nodeVar26 ) ) ), 2.0 ) ) * 0.3183098861837907 ) ) ) ) ) + ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar27 * ( vec3<f32>( 0.0, 0.0, 0.0 ) + nodeVar12 ) ) ) + ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( ( ( nodeVar12 * nodeVar13 ) / ( vec3<f32>( 1.0 ) - ( vec3<f32>( nodeVar14 ) * nodeVar13 ) ) ) * vec3<f32>( nodeVar14 ) ) ) * nodeVar17 ) ) * vec3<f32>( clamp( ( nodeVar18 - ( 1.0 - pow( ( clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 ) + nodeVar18 ), exp2( -( 1.0 - ( Roughness * -16.0 ) ) ) ) ) ), 0.0, 1.0 ) ) ) ), 1.0 ) ).xyz + NodeUniforms[index].nodeUniform11 ), DiffuseColor.w );
        
            // result
            return vec4<f32>( mix( ( ( pow( nodeVar28.xyz, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( nodeVar28.xyz * vec3<f32>( 12.92 ) ), vec3<f32>( threejs_lessThanEqual( nodeVar28.xyz, vec3<f32>( 0.0031308 ) ) ) ), nodeVar28.w );
        
        }
        `
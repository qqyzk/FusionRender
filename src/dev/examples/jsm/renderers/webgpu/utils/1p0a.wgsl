 ( vec4<f32>( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar9 * ( DiffuseColor.xyz * vec3<f32>( 0.3183098861837907 ) ) ) ), 1.0 ) + ( ( ( vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), 1.0 ) + ( vec4<f32>( nodeVar10, 1.0 ) * ( DiffuseColor * vec4<f32>( vec3<f32>( 0.3183098861837907 ), 1.0 ) ) ) ) + ( ( DiffuseColor * vec4<f32>( vec3<f32>( ( 1.0 - max( max( nodeVar16.x, nodeVar16.y ), nodeVar16.z ) ) ), 1.0 ) ) * vec4<f32>( nodeVar18, 1.0 ) ) ) * vec4<f32>( vec3<f32>( nodeVar19 ), 1.0 ) ) ) 
 
  ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar9 * ( ( ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar22 ) ) ) + vec3<f32>( ( 1.0 * nodeVar22 ) ) ) * vec3<f32>( ( 0.5 / max( ( ( nodeVar23 * sqrt( ( nodeVar25 + ( ( 1.0 - nodeVar25 ) * pow( nodeVar26, 2.0 ) ) ) ) ) + ( nodeVar26 * sqrt( ( nodeVar25 + ( ( 1.0 - nodeVar25 ) * pow( nodeVar23, 2.0 ) ) ) ) ) ), 0.000001 ) ) ) ) * vec3<f32>( ( ( nodeVar27 / pow( ( 1.0 - ( pow( clamp( dot( TransformedNormalView, nodeVar20 ), 0.0, 1.0 ), 2.0 ) * ( 1.0 - nodeVar27 ) ) ), 2.0 ) ) * 0.3183098861837907 ) ) ) ) ) + ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( nodeVar28 * ( vec3<f32>( 0.0, 0.0, 0.0 ) + nodeVar13 ) ) ) + ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( ( ( nodeVar13 * nodeVar14 ) / ( vec3<f32>( 1.0 ) - ( vec3<f32>( nodeVar15 ) * nodeVar14 ) ) ) * vec3<f32>( nodeVar15 ) ) ) * nodeVar18 ) ) * vec3<f32>( clamp( ( nodeVar19 - ( 1.0 - pow( ( clamp( dot( TransformedNormalView, normalize( nodeVarying5 ) ), 0.0, 1.0 ) + nodeVar19 ), exp2( -( 1.0 - ( Roughness * -16.0 ) ) ) ) ) ), 0.0, 1.0 ) ) ) 
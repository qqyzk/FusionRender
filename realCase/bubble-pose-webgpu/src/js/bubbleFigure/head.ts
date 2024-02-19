import * as THREE from '../utils/three.module';

import { createBody } from '../physics';
import { createBubble } from '../shapes/basic';
import { getRandomFloat, getRandomInt } from '../utils/maths';
import { BUBBLE_BODY_MATERIAL } from './physicalBody';
import {arrHeadx} from './Coordinate'

export function createBubbleHead(radius = 1.2, numSpheres = 50): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HEAD';
  group.visible = false;
  group.userData.radius = radius;

  for (let i = 0; i < numSpheres; i++) {
    const bubble = createHeadBubble(radius);
    group.add(bubble);
  }

  return group;
}

function createHeadBubble(radius: number): THREE.Mesh {
  const randomRadius = getRandomFloat(0.1, 0.4);

  const bubble = createBubble({ radius: randomRadius, offset: 0 });
  const angle1 = getRandomInt(0, 50);
  const angle2 = getRandomInt(0, 50);

  //const x = radius * Math.sin(angle1) * Math.cos(angle2);
  //const y = radius * Math.sin(angle1) * Math.sin(angle2);
  //const z = radius * getRandomFloat(0, 0.5);

  
  /*console.log('x=');
  console.log(x);
  console.log('y=');
  console.log(y);
  console.log('z=');
  console.log(z);*/
  const x = 1.1444583489953266;
  const y = 0.010130351659340706;
  const z = 0.34651565685232977;
  //console.log(22222);

  bubble.position.set(x, y, z);
  bubble.userData.body = createBody(bubble, BUBBLE_BODY_MATERIAL, 0);

  return bubble;
}

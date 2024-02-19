import { Keypoint, Pose, PoseDetector } from '@tensorflow-models/pose-detection';
import * as THREE from './utils/three.module';

import { getCameraVideoElement, getSelectedVideoInputDeviceId } from './media';
import { getParameters } from './parameters';
import { getSum } from './utils/maths';

// importing pose detection libraries locally doesn't work
// @ts-ignore
const { poseDetection } = window;
let savePhrase = false;

let video: HTMLVideoElement;
let detector: PoseDetector;
let hasPoses = false;

async function getDetector(): Promise<PoseDetector> {
  const model = poseDetection.SupportedModels.BlazePose;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
  };
  return await poseDetection.createDetector(model, detectorConfig);
}

export async function initBodyDetection() {
  try {
    const videoInputDeviceId = await getSelectedVideoInputDeviceId();
    if(savePhrase){
      video = await getCameraVideoElement(videoInputDeviceId);
      detector = await getDetector();
    }
  } catch (error) {
    console.error(error);
  }
}
/*async function getPoses(): Promise<Pose[]> {

  return poses;
  
}*/

async function getPoses(): Promise<Pose[]> {
  if (!(detector && video)) {
    return [];
  }

  const poses = await detector.estimatePoses(video, {});

  if (!poses?.length) {
    return [];
  }

  const { keypoints } = poses[0];
  const scoreSum = getSum<Keypoint>(keypoints, (keypoint) => keypoint?.score ?? 0);

  const { minPosesScore } = getParameters();

  if (scoreSum < minPosesScore) {
    return [];
  }

  //console.log('poses');
  //console.log(poses);
  var jsonString = JSON.stringify(poses);
  window.localStorage.setItem('scene', jsonString);
  //console.log(poses);
  //const poses2 = JSON.parse(localStorage.getItem('scene'));
  /*
  const blob = new Blob([jsonString], { type: 'application/json'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'group.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);*/
  //var bubbleJson = getScene().toJSON();
  //var output =JSON.stringify(bubbleJson);
  //const blob = new Blob([output], { type: 'application/json' });

  // 创建一个URL，然后将其保存到本地文件
  /*const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'group.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return poses;*/
  return poses;
}

type DetectPosesReturnType = {
  poses: Pose[];
  posesLost: boolean;
  posesFound: boolean;
};

export async function detectPoses(): Promise<DetectPosesReturnType> {
  let poses;
  if(savePhrase){
    poses = await getPoses();//3
  }

  /*var poses;
  const retrievedData = localStorage.getItem('scene');
  if (retrievedData) {
    const parsedScene = new THREE.ObjectLoader().parse(JSON.parse(retrievedData));
    // 可以对反序列化后的场景对象进行操作
    const retrievedCube = parsedScene.getObjectByName(cube.name);
    if (retrievedCube) {
      retrievedCube.position.x += 2;
    }
    poses = parsedScene;
  }
  console.log(poses);
  */
 
  const posesExist = !!poses.length;

  const posesLost = !posesExist && hasPoses;
  const posesFound = posesExist && !hasPoses;

  hasPoses = posesExist;

  //console.log('poses');
  //console.log(poses);
  //console.log('posesLost');
  //console.log(posesLost);
  //console.log('posesFound');
  //console.log(posesFound);
  return { poses, posesLost, posesFound };
}

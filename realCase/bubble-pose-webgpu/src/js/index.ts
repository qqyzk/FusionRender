import { initBodyDetection } from './bodyDetection';
import * as THREE from './utils/three.module';
import { resetBubbleFigure, updateBubbleFigure } from './bubbleFigure/index';
import { BUBBLE_BODY_MATERIAL } from './bubbleFigure/physicalBody';
import { clearScene, initCinematography, renderScene, updateCamera } from './cinematography';
import { initControls } from './controls';
import { initParameters } from './parameters';
import { addCollidingContactMaterial, initWorld, worldStep } from './physics';
import { SHAPE_BODY_MATERIAL, resetShapes, updateShapes } from './shapes/falling';
import { caseShow } from './bubbleFigure/case';
let savePhrase = false;

let flag=1;
let startFlag = true;
let frameCount = 0;
let startTime = null;
let shouldLog = true;
let first = true;
let frameSum=0;
const render = async function () {
  requestAnimationFrame(render);//请求下一帧的渲染，创建一个动画循环
  if(flag){
    worldStep();//更新物理仿真世界的状态,使仿真世界中的物体按照每 1/60 秒的时间步进进行模拟
    updateShapes();//更新物理仿真中的形状
    await updateBubbleFigure();//用于更新与气泡图形相关的内容,与人体姿势监测相关？
    if(!savePhrase)
      flag=0;
  }
  console.log('new')
  renderScene();//渲染场景
  let time = performance.now();
	if (startFlag && frameCount > 30) {
			startTime = time;
			startFlag = false;
			frameCount=0;
			console.log('start')
	}
	
	frameCount += 1;
	if(frameCount % 1000 === 0) {
		let fps = 1000 * frameCount / (time - startTime);
		console.log(frameCount,fps,'fps');
	} 
	if ((time - startTime) /1000 > 60 && shouldLog){
		shouldLog = false;
		let fps = 1000 * frameCount / (time - startTime);
		console.log('1min', (time - startTime)/1000, frameCount,fps,'fps');
	}
};

async function start() {
  initParameters();//初始化参数
  initCinematography();//初始化相机
  initWorld();//初始化物理仿真世界
  await initControls({ onSubmit: updateParameters });//用户提交表单时更新参数
  resetShapes();//重置图形参数
  addCollidingContactMaterial(BUBBLE_BODY_MATERIAL, SHAPE_BODY_MATERIAL);//用于添加碰撞或接触材料，以定义物体之间的物理交互。
  render();//启动渲染循环
  //updateBubbleFigure();
  await initBodyDetection();//初始化身体检测功能
  //caseShow();
}

function updateParameters() {
  clearScene();//清空场景
  resetBubbleFigure();//重置气泡图形
  updateCamera();//更新相机参数
  resetShapes();//重置图形参数
}

start();
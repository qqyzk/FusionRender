import * as THREE from '../utils/three.module';

import { detectPoses } from '../bodyDetection';
import { getScene } from '../cinematography';
import { getWorld } from '../physics';
import { disposeGroup } from '../utils/three';
import { alignBubbleFigurePose } from './alignPose';
import { createBubbleBody } from './body';
import { createBubbleHead } from './head';
import fs from 'fs/promises'; // 导入 Node.js 的文件系统模块

let bubbleFigure: THREE.Group | null = null;

var flag = 1;
let savePhrase = false;
let downloadPhrase = false;
let saveIndex = 10;

//根据检测到的姿势来更新气泡图形的状态。!!!!!!!
export async function updateBubbleFigure() {
 
  if(savePhrase){
    const { poses, posesLost, posesFound } = await detectPoses();//1
   console.log(posesFound);
    if (posesLost) {
      disposeBubbleFigure();
    } else if (posesFound) {
      var jsonString = JSON.stringify(poses);
      window.localStorage.setItem('poses'+saveIndex++, jsonString);
      console.log('poses');
      console.log(poses);
      createBubbleFigure();
    }
    if(flag){
      createBubbleFigure();
    }
  
    if (!poses.length || !bubbleFigure) {
      return;
    }
  
    alignBubbleFigurePose(bubbleFigure, poses[0]);
  }else if(downloadPhrase){
    window.localStorage.getItem('poses17');
    const poses = JSON.parse(window.localStorage.getItem('poses17') || '{}');
    //console.log(poses);
    const  posesLost = false;
    const posesFound = true;
    if(flag){
      const data = window.localStorage.getItem('poses17')||'{}';
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = 'pose0.txt'; // 指定文件名
      a.style.display = 'none';
      
      document.body.appendChild(a);
      
      a.click();
      
      // 清理
      window.URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    }
    if(flag){
      createBubbleFigure();
    }
  
    if (!poses.length || !bubbleFigure) {
      return;
    }
  
    alignBubbleFigurePose(bubbleFigure, poses[0]);
  } else{
    await fetch('./pose12.txt')
    .then(response => response.text())
    .then(data => {
      console.log(data); // 输出文件内容
   
      const poses =  JSON.parse(data);
      console.log(poses);
      if(flag){
        createBubbleFigure();
      }
    
      if (!poses.length || !bubbleFigure) {
        return;
      }
    
      alignBubbleFigurePose(bubbleFigure, poses[0]);
    })
    .catch(error => {
      console.error('Error reading file:', error);
    });
  }
 


}

export function resetBubbleFigure() {
  disposeBubbleFigure();
  createBubbleFigure();
}

//创建Bubble用来模拟人体！！！！
export function createBubbleFigure(): THREE.Group {
  flag = 0;
  bubbleFigure = new THREE.Group();
  const head = createBubbleHead();
  const body = createBubbleBody();

  bubbleFigure.name = 'FIGURE';
  bubbleFigure.add(head);
  bubbleFigure.add(body);
  const bubbleFigure1 = bubbleFigure;



  //console.log(11111)
  getScene().add(bubbleFigure1);
  //const bubbleJson = bubbleFigure.toJSON();

  //console.log(bubbleFigure1);

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
  document.body.removeChild(a);*/
  //var exporter = new THREE.SceneExporter();
  //var sceneJson = JSON.stringify(exporter.parse(getScene()));
  //localStorage.setItem('scene', sceneJson);
  //window.localStorage.setItem('bubble', JSON.stringify(bubbleFigure.toJSON()));
  //const bubbleFigure2 = JSON.parse(localStorage.getItem('bubble'));
  return bubbleFigure;
  //console.log(bubbleFigure.parent);
  //console.log(bubbleFigure.children);
  //console.log(1111);
  //console.log(bubbleFigure.children[0].children);
  //console.log(2222);
  //console.log(bubbleFigure.children[1].children);
  /*
  const myScene = getScene();
  console.log(myScene.constructor.name);
  console.log('myScene');
  console.log(myScene);
  const serializedScene = JSON.stringify(myScene.toJSON());
  localStorage.setItem('sceneData', serializedScene);
  const retrievedData = localStorage.getItem('sceneData');
  if (retrievedData) {
    const parsedScene = new THREE.ObjectLoader().parse(JSON.parse(retrievedData));
    // 可以对反序列化后的场景对象进行操作
    const retrievedCube = parsedScene.getObjectByName(cube.name);
    if (retrievedCube) {
      retrievedCube.position.x += 2;
    }
    // 添加到新的场景中或当前场景中
    getScene().add(parsedScene);
}*/

/*
  const clonedGroup = _.cloneDeepWith(bubbleFigure, (value) => {
    // 自定义深拷贝逻辑，处理循环引用
    if (_.isObject(value)) {
      if (value instanceof THREE.Object3D) {
        // 处理Three.js对象，例如Mesh、Group等
        return undefined; // 或者自定义逻辑来复制Three.js对象
      }
    }
    // 其他情况保持默认行为
    return undefined;
  });
  const jsonString = JSON.stringify(clonedGroup);
  // 创建一个Blob对象
  const blob = new Blob([jsonString], { type: 'application/json' });

  // 创建一个URL，然后将其保存到本地文件
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'group.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  // 创建一个input[type="file"]元素用于选择本地文件
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';

// 添加input元素到页面并监听文件选择事件
document.body.appendChild(input);
input.addEventListener('change', (event) => {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const json = JSON.parse(e.target.result);
      const loader = new THREE.ObjectLoader();
      const loadedGroup = _.cloneDeepWith(loadedData, (value) => {
        // 自定义深拷贝逻辑，处理循环引用
        if (_.isObject(value)) {
          if (value instanceof THREE.Object3D) {
            // 处理Three.js对象，例如Mesh、Group等
            return undefined; // 或者自定义逻辑来复制Three.js对象
          }
        }
        // 其他情况保持默认行为
        return undefined;
      });
      // 现在，loadedGroup是从JSON数据创建的Group对象，您可以将其添加到场景中
      getScene().add(loadedGroup);
    };
    reader.readAsText(file);
  }
});
/*
  // 假设group是您要保存的Group对象
  const groupJSON = bubbleFigure.toJSON();
  const jsonString = JSON.stringify(groupJSON);

  // 创建一个Blob对象
  const blob = new Blob([jsonString], { type: 'application/json' });

  // 创建一个URL，然后将其保存到本地文件
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'group.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  // 创建一个input[type="file"]元素用于选择本地文件
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';

// 添加input元素到页面并监听文件选择事件
document.body.appendChild(input);
input.addEventListener('change', (event) => {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const json = JSON.parse(e.target.result);
      const loader = new THREE.ObjectLoader();
      const loadedGroup = loader.parse(json);

      // 现在，loadedGroup是从JSON数据创建的Group对象，您可以将其添加到场景中
      getScene().add(loadedGroup);
    };

    reader.readAsText(file);
  }
});*/
  /*
  //将bubbleFigure转换成json字符串
  const extractedData = {
    // 从 bubbleFigure 中提取需要的属性
    parent: bubbleFigure.parent,
    //children: bubbleFigure.children,
  };
  
  const jsonBubbleFigure = JSON.stringify(extractedData);
  //const jsonBubbleFigure = bubbleFigure.toJSON();
  console.log(jsonBubbleFigure);
  //const jsonString = JSON.stringify(jsonBubbleFigure);
  //console.log(jsonString);
  //将json字符串保存到本地的路径中
  localStorage.setItem('groupData', jsonBubbleFigure);
  //从本地路径中查找json字符串
  const retrievedJsonBubbleFigure = localStorage.getItem('groupData');
  if (retrievedJsonBubbleFigure) {
    // 解析 JSON 字符串为 Group 对象
    const retrievedGroup: THREE.Group = JSON.parse(retrievedJsonBubbleFigure);
  
    // 使用 retrievedGroup 进行渲染操作
    console.log(retrievedGroup);
    getScene().add(retrievedGroup);
  } else {
    console.log('未找到存储的数据');
  }*/
}

function disposeBubbleFigure() {
  if (!bubbleFigure) {
    return;
  }

  getScene().remove(bubbleFigure);
  disposeGroup(bubbleFigure, (mesh: THREE.Mesh) => {
    if (!mesh.userData?.body) {
      return;
    }

    getWorld().removeBody(mesh.userData.body);
  });

  bubbleFigure = null;
}

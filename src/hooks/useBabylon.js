import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  SceneLoader,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { useCallback, useEffect, useState } from "react";
import { convertFbxToGlb, getFileExtension } from "../utils";

const useBabylon = (currentFile, renderingCanvas) => {
  const [scene, setScene] = useState();
  const [camera, setCamera] = useState();

  // scene이 준비되면 호출할 함수
  const handleSceneReady = useCallback(
    (scene) => {
      if (renderingCanvas) {
        // add camera
        const innerCamera = new ArcRotateCamera(
          "camera1",
          0,
          0,
          3,
          new Vector3(0, 0, 0),
          scene
        );
        innerCamera.setPosition(new Vector3(0, 3, 5));
        setCamera(innerCamera);
        // model에 target 지정 시 panning 불가
        innerCamera.setTarget(Vector3.Zero());
        innerCamera.attachControl(renderingCanvas, false, true);
        innerCamera.allowUpsideDown = false;

        innerCamera.inertia = 0.5;
        innerCamera.wheelPrecision = 50;
        innerCamera.lowerRadiusLimit = 2;
        innerCamera.upperRadiusLimit = 20;

        innerCamera.panningAxis = new Vector3(1, 1, 0);
        innerCamera.pinchPrecision = 50;
        innerCamera.panningInertia = 0.5;
        innerCamera.panningDistanceLimit = 20;

        // add light
        const light = new HemisphericLight(
          "light1",
          new Vector3(0, 1, 0),
          scene
        );
        light.intensity = 0.7;
      }
    },
    [renderingCanvas]
  );

  // 초기 세팅
  useEffect(() => {
    if (renderingCanvas) {
      // create engine
      const engine = new Engine(renderingCanvas, true);

      // create scene
      const innerScene = new Scene(engine);
      setScene(innerScene);

      if (innerScene.isReady()) {
        handleSceneReady(innerScene);
      } else {
        innerScene.onReadyObservable.addOnce((innerScene) => {
          handleSceneReady(innerScene);
        });
      }

      engine.runRenderLoop(() => {
        innerScene.render();
      });

      return () => {
        engine.dispose();
      };
    }
  }, [handleSceneReady, renderingCanvas]);

  // input file 변화 시 호출
  useEffect(() => {
    const loadFbxFile = async (file, scene) => {
      const glbFileUrl = await convertFbxToGlb(file)
        .then((res) => res)
        .catch((err) => {
          alert(err);
        });
      SceneLoader.ImportMesh(
        "",
        "",
        glbFileUrl,
        scene,
        (meshes, _, skeletons, animationGroups, transformNodes) => {
          // if (camera) {
          //   camera.setTarget(Vector3.Zero());
          // }
          console.log(meshes);
          console.log(skeletons);
          console.log(animationGroups);
          console.log(transformNodes);
        }
      );
    };

    if (scene && currentFile) {
      let fileExtension;

      try {
        fileExtension = getFileExtension(currentFile);
      } catch (error) {
        alert("Can't get the extension of this file");
      }

      if (fileExtension) {
        if (fileExtension === "glb" || fileExtension === "gltf") {
          // glb, gltf 파일 import
          SceneLoader.ImportMesh(
            "",
            "file:",
            currentFile,
            scene,
            (meshes, _, skeletons, animationGroups, transformNodes) => {
              // if (camera) {
              //   camera.setTarget(Vector3.Zero());
              // }
              console.log(meshes);
              console.log(skeletons);
              console.log(animationGroups);
              console.log(transformNodes);
            }
          );
        } else {
          // fbx 파일 import (blender api 사용)
          loadFbxFile(currentFile, scene);
        }
      }
    }

    // return () => {};
  }, [camera, currentFile, scene]);
};

export default useBabylon;

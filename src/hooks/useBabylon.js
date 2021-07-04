import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { useCallback, useEffect, useState } from "react";
import { convertFbxToGlb, getFileExtension } from "../utils";

const useBabylon = (currentFile, renderingCanvas) => {
  const [scene, setScene] = useState();
  const [camera, setCamera] = useState();

  // scene이 준비되면 호출할 함수
  const handleSceneReady = useCallback(
    (scene) => {
      if (renderingCanvas.current) {
        // add camera
        const innerCamera = new BABYLON.ArcRotateCamera(
          "camera1",
          0,
          0,
          3,
          new BABYLON.Vector3(0, 0, 0),
          scene
        );
        innerCamera.setPosition(new BABYLON.Vector3(0, 3, 5));
        setCamera(innerCamera);
        // model에 target 지정 시 panning 불가
        innerCamera.setTarget(BABYLON.Vector3.Zero());
        innerCamera.attachControl(renderingCanvas.current, false, true);
        innerCamera.allowUpsideDown = false;
        innerCamera.minZ = 0.1;

        innerCamera.inertia = 0.5;
        innerCamera.wheelPrecision = 50;
        innerCamera.lowerRadiusLimit = 0.1;
        innerCamera.upperRadiusLimit = 20;

        innerCamera.panningAxis = new BABYLON.Vector3(1, 1, 0);
        innerCamera.pinchPrecision = 50;
        innerCamera.panningInertia = 0.5;
        innerCamera.panningDistanceLimit = 20;

        // add light
        const light = new BABYLON.HemisphericLight(
          "light1",
          new BABYLON.Vector3(0, 1, 0),
          scene
        );
        light.intensity = 0.7;

        // data load observable
        scene.onDataLoadedObservable.add((scene) => {
          console.log("data loaded!");
        });
      }
    },
    [renderingCanvas]
  );

  // 초기 세팅
  useEffect(() => {
    if (renderingCanvas.current) {
      // create engine
      const engine = new BABYLON.Engine(renderingCanvas.current, true);

      // create scene
      const innerScene = new BABYLON.Scene(engine);

      if (innerScene.isReady()) {
        handleSceneReady(innerScene);
        setScene(innerScene);
      } else {
        innerScene.onReadyObservable.addOnce((innerScene) => {
          handleSceneReady(innerScene);
          setScene(innerScene);
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

  const addAssetsToCurrentScene = (assetContainer, scene) => {
    const {
      animationGroups,
      geometries,
      materials,
      meshes,
      textures,
      skeletons,
      transformNodes,
    } = assetContainer;

    // animation group
    if (animationGroups.length !== 0) {
      animationGroups.forEach((animationGroup) => {
        scene.addAnimationGroup(animationGroup);
      });
    }

    // geometry
    if (geometries.length !== 0) {
      geometries.forEach((geometry) => {
        scene.addGeometry(geometry);
      });
    }

    // material
    if (materials.length !== 0) {
      materials.forEach((material) => {
        scene.addMaterial(material);
      });
    }

    // mesh
    if (meshes.length !== 0) {
      meshes.forEach((mesh) => {
        scene.addMesh(mesh);
      });
    }

    // texture
    if (textures.length !== 0) {
      textures.forEach((texture) => {
        scene.addTexture(texture);
      });
    }

    // skeletons
    if (skeletons.length !== 0) {
      skeletons.forEach((skeleton) => {
        scene.addSkeleton(skeleton);
      });
    }

    // transformNodes
    if (transformNodes.length !== 0) {
      transformNodes.forEach((transformNode) => {
        scene.addTransformNode(transformNode);
      });
    }
  };

  // input file 변화 시 호출
  useEffect(() => {
    const loadFbxFile = async (file, scene) => {
      const glbFileUrl = await convertFbxToGlb(file)
        .then((res) => res)
        .catch((err) => {
          alert(err);
        });
      const loadedAssetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        glbFileUrl,
        "",
        scene
      );
      console.log("loadedAssetContainer: ", loadedAssetContainer);
      addAssetsToCurrentScene(loadedAssetContainer, scene);
    };

    const loadGlbOrGltfFile = async (file, scene) => {
      const loadedAssetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        "file:",
        currentFile,
        scene
      );
      console.log("loadedAssetContainer: ", loadedAssetContainer);
      addAssetsToCurrentScene(loadedAssetContainer, scene);
    };

    const loadBabylonFile = async (file, scene) => {
      const loadedAssetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        "file:",
        currentFile,
        scene
      );
      console.log("loadedAssetContainer: ", loadedAssetContainer);
      addAssetsToCurrentScene(loadedAssetContainer, scene);
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
          loadGlbOrGltfFile(currentFile, scene);
        } else if (fileExtension === "babylon") {
          // babylon 파일 import
          loadBabylonFile(currentFile, scene);
        } else {
          // fbx 파일 import (blender api 사용)
          loadFbxFile(currentFile, scene);
        }
      }
    }

    // return () => {};
  }, [camera, currentFile, scene]);

  return { scene };
};

export default useBabylon;

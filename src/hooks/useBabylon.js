import * as BABYLON from "@babylonjs/core";
import { SkeletonViewer } from "@babylonjs/core/Debug";
import "@babylonjs/loaders/glTF";
import { useCallback, useEffect, useState } from "react";
import {
  convertFbxToGlb,
  getFileExtension,
  logBonesDirections,
} from "../utils";

const useBabylon = (currentFile, renderingCanvas) => {
  const [scene, setScene] = useState();
  const [camera, setCamera] = useState();

  const [currentBone, setCurrentBone] = useState(null);
  const [gizmoManager, setGizmoManager] = useState();

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
        innerCamera.wheelDeltaPercentage = 0.01;
        innerCamera.lowerRadiusLimit = 0.1;
        innerCamera.upperRadiusLimit = 20;

        innerCamera.panningAxis = new BABYLON.Vector3(1, 1, 0);
        innerCamera.pinchPrecision = 50;
        innerCamera.panningInertia = 0.5;
        innerCamera.panningDistanceLimit = 20;

        // hemispheric light
        const light = new BABYLON.HemisphericLight(
          "light1",
          new BABYLON.Vector3(0, 1, 0),
          scene
        );
        light.intensity = 0.7;

        // data load observable
        scene.onDataLoadedObservable.add((scene, eventState) => {
          // console.log("data loaded!");
        });

        // gizmo manager 생성 및 observable 설정
        const innerGizmoManager = new BABYLON.GizmoManager(scene);
        innerGizmoManager.usePointerToAttachGizmos = false;
        setGizmoManager(innerGizmoManager);

        // gizmo attach observable
        innerGizmoManager.onAttachedToNodeObservable.add(
          (transformNode, eventState) => {}
        );
      }
    },
    [renderingCanvas]
  );

  // 초기 세팅
  useEffect(() => {
    if (renderingCanvas.current) {
      // create engine
      const engine = new BABYLON.Engine(renderingCanvas.current, true);

      // use matrices interpolation for animations
      BABYLON.Animation.AllowMatricesInterpolation = true;

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

      // 개발환경에서의 에러발생 방지
      innerScene.onDisposeObservable.addOnce(() => {
        window.location.reload();
      });

      engine.runRenderLoop(() => {
        innerScene.render();
      });

      return () => {
        engine.dispose();
      };
    }
  }, [handleSceneReady, renderingCanvas]);

  const addAssetsToCurrentScene = useCallback(
    (assetContainer, scene) => {
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
          animationGroup.pause();
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
          mesh.isPickable = false;
          mesh.receiveShadows = false;
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

        // 모든 bone의 모든 축 기준 direction을 콘솔에 로그
        // logBonesDirections(skeletons[0].bones, meshes[0])

        const SKELETON_VIEWER_OPTION = {
          pauseAnimations: false,
          returnToRest: false,
          computeBonesUsingShaders: true,
          useAllBones: true,
          displayMode: SkeletonViewer.DISPLAY_SPHERE_AND_SPURS,
          displayOptions: {
            sphereBaseSize: 0.01,
            sphereScaleUnit: 15,
            sphereFactor: 0.9,
            midStep: 0.25,
            midStepFactor: 0.05,
          },
        };

        // skeleton viewer
        const skeletonView = new SkeletonViewer(
          skeletons[0],
          meshes[0],
          scene,
          true, //autoUpdateBoneMatrices?
          meshes[0].renderingGroupId > 0 ? meshes[0].renderingGroupId + 1 : 1, // renderingGroup
          SKELETON_VIEWER_OPTION
        );
        // babylon bug로 인해 초기 isEnabled를 true로 설정
        skeletonView.isEnabled = true;

        // Bone에 pickable sphere 부착
        skeletons[0].bones.forEach((bone, idx) => {
          if (bone.name !== "Scene") {
            const sphere = BABYLON.MeshBuilder.CreateSphere(
              "jointSphere",
              {
                diameter: 3,
              },
              scene
            );
            sphere.boneIdx = idx;
            sphere.renderingGroupId = 3;
            sphere.attachToBone(bone, meshes[0]);
            // hover cursor 설정
            sphere.actionManager = new BABYLON.ActionManager(scene);
            sphere.actionManager.registerAction(
              new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                (event) => {
                  // const { source, meshUnderPointer } = event;
                  scene.hoverCursor = "pointer";
                }
              )
            );
            sphere.actionManager.registerAction(
              new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                (event) => {
                  // const { source, meshUnderPointer } = event;
                  scene.hoverCursor = "default";
                }
              )
            );
          }
        });

        scene.onPointerObservable.add((pointerInfo, eventState) => {
          const { pickInfo } = pointerInfo;
          if (pickInfo.hit) {
            switch (pickInfo.pickedMesh.name) {
              case "jointSphere": {
                const bone = skeletons[0].bones[pickInfo.pickedMesh.boneIdx];

                gizmoManager.positionGizmoEnabled = false;
                gizmoManager.rotationGizmoEnabled = false;
                gizmoManager.scaleGizmoEnabled = false;

                setCurrentBone(bone);
                gizmoManager.positionGizmoEnabled = true;
                gizmoManager.attachToNode(bone._linkedTransformNode);
                break;
              }
              case "torusController": {
                const bone = skeletons[0].bones[pickInfo.pickedMesh.boneIdx];

                gizmoManager.positionGizmoEnabled = false;
                gizmoManager.rotationGizmoEnabled = false;
                gizmoManager.scaleGizmoEnabled = false;

                setCurrentBone(bone);
                gizmoManager.positionGizmoEnabled = true;
                gizmoManager.attachToNode(bone._linkedTransformNode);
                break;
              }
              default:
                break;
            }
          }
        }, BABYLON.PointerEventTypes.POINTERPICK);
      }

      // transformNodes
      if (transformNodes.length !== 0) {
        transformNodes.forEach((transformNode) => {
          scene.addTransformNode(transformNode);
        });
      }
    },
    [gizmoManager]
  );

  useEffect(() => {
    if (gizmoManager) {
      const handleKeyDown = (event) => {
        switch (event.key) {
          case "w":
            if (!gizmoManager.positionGizmoEnabled) {
              gizmoManager.positionGizmoEnabled = true;
              if (currentBone) {
                gizmoManager.attachToNode(currentBone._linkedTransformNode);
              }
            }
            gizmoManager.rotationGizmoEnabled = false;
            gizmoManager.scaleGizmoEnabled = false;
            break;
          case "e":
            if (!gizmoManager.rotationGizmoEnabled) {
              gizmoManager.rotationGizmoEnabled = true;
              if (currentBone) {
                gizmoManager.attachToNode(currentBone._linkedTransformNode);
              }
            }
            gizmoManager.positionGizmoEnabled = false;
            gizmoManager.scaleGizmoEnabled = false;
            break;
          case "r":
            if (!gizmoManager.scaleGizmoEnabled) {
              gizmoManager.scaleGizmoEnabled = true;
              if (currentBone) {
                gizmoManager.attachToNode(currentBone._linkedTransformNode);
              }
            }
            gizmoManager.positionGizmoEnabled = false;
            gizmoManager.rotationGizmoEnabled = false;
            break;
          case "Escape":
            gizmoManager.positionGizmoEnabled = false;
            gizmoManager.rotationGizmoEnabled = false;
            gizmoManager.scaleGizmoEnabled = false;
            break;
          default:
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [currentBone, gizmoManager]);

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
      addAssetsToCurrentScene(loadedAssetContainer, scene);
    };

    const loadGlbFile = async (file, scene) => {
      const loadedAssetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        "file:",
        file,
        scene
      );
      addAssetsToCurrentScene(loadedAssetContainer, scene);
    };

    const loadBabylonFile = async (file, scene) => {
      const loadedAssetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        "file:",
        file,
        scene
      );
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
          loadGlbFile(currentFile, scene);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, currentFile, scene]);

  return { scene };
};

export default useBabylon;

import * as BABYLON from "@babylonjs/core";
// import { SkeletonViewer } from "@babylonjs/core/Debug";
import "@babylonjs/loaders/glTF";
import { useCallback, useEffect, useState } from "react";
import { convertFbxToGlb, getFileExtension, SkeletonWidget } from "../utils";

const useBabylon = (currentFile, renderingCanvas) => {
  const [scene, setScene] = useState();
  const [camera, setCamera] = useState();
  const [hasController, setHasController] = useState(false);

  const [gizmoManager, setGizmoManager] = useState();
  const [gizmoAttachableMeshes, setGizmoAttachableMeshes] = useState([]);

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

        // add light
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

        // pointer observable에 pick event callback 추가
        // scene.onPointerObservable.add((pointerInfo, eventState) => {
        //   const { pickInfo } = pointerInfo;
        //   if (pickInfo.hit) {
        //     pickInfo.pickedMesh.refreshBoundingInfo(true);
        //     const indices = pickInfo.pickedMesh.getIndices();
        //     const matricesIndices = pickInfo.pickedMesh.getVerticesData(
        //       BABYLON.VertexBuffer.MatricesIndicesKind
        //     );
        //     const vertexId = indices[pickInfo.faceId * 3];
        //     const sceneAndArmatureRemovedBones = pickInfo.pickedMesh.skeleton.bones.filter(
        //       (bone) => bone.name !== "Scene" && bone.name !== "Armature"
        //     );
        //     const candidateBoneIndices = [
        //       matricesIndices[vertexId * 4],
        //       matricesIndices[vertexId * 4 + 1],
        //       matricesIndices[vertexId * 4 + 2],
        //       matricesIndices[vertexId * 4 + 3],
        //     ];
        //     let minDistance = Infinity;
        //     let selectedBone;
        //     let selectedBoneIndex;
        //     candidateBoneIndices.forEach((boneIndex, idx) => {
        //       const distance = BABYLON.Vector3.Distance(
        //         pickInfo.pickedPoint,
        //         sceneAndArmatureRemovedBones[boneIndex].getAbsolutePosition()
        //       );
        //       if (distance < minDistance) {
        //         minDistance = distance;
        //         selectedBone = sceneAndArmatureRemovedBones[boneIndex];
        //         selectedBoneIndex = boneIndex;
        //       }
        //     });

        //     console.log("candidateBoneIndices: ", candidateBoneIndices);
        //     console.log(
        //       "candidateBones: ",
        //       candidateBoneIndices.map((i) => sceneAndArmatureRemovedBones[i])
        //     );

        //     console.log("selectedBone.name: ", selectedBone.name);
        //   }
        // }, BABYLON.PointerEventTypes.POINTERPICK);

        // gizmo manager 생성 및 observable 설정
        const innerGizmoManager = new BABYLON.GizmoManager(scene);
        setGizmoManager(innerGizmoManager);

        // gizmo attach observable
        innerGizmoManager.onAttachedToMeshObservable.add((...params) => {});

        innerGizmoManager.onAttachedToNodeObservable.add((...params) => {});
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

        if (hasController) {
          const toruses = [];
          // 자동 controller 부착
          skeletons[0].bones.forEach((bone) => {
            const torus = BABYLON.MeshBuilder.CreateTorus("controller", {
              diameter: bone.name === "Armature" ? 2 : 0.2,
              thickness: 0.005,
              tessellation: bone.name === "Armature" ? 64 : 32,
              sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            });
            torus.renderOverlay = true;
            torus.overlayColor = BABYLON.Color3.Red();
            torus.renderingGroupId = 3;

            torus.position = bone.getAbsolutePosition();
            torus.setParent(bone);
            torus.attachToBone(bone);

            toruses.push(torus);
          });

          setGizmoAttachableMeshes(
            // skeletons[0].bones.filter((bone) => bone.name !== "Scene")
            toruses
          );
        }

        const skeletonWidget = new SkeletonWidget(
          meshes[0],
          scene,
          skeletons[0],
          {
            spherePointBaseSize: 0.035,
            spherePointMinSize: 0.01,
            boneMeshHalfwayRatio: 0.1,
            boneMeshHalfwayScale: 0.05,
          }
        );
        skeletonWidget.build(true);

        // const SKELETON_VIEWER_OPTION = {
        //   pauseAnimations: false,
        //   returnToRest: false,
        //   computeBonesUsingShaders: true,
        //   useAllBones: true,
        //   displayMode: SkeletonViewer.DISPLAY_SPHERE_AND_SPURS,
        //   displayOptions: {
        //     sphereBaseSize: 1,
        //     sphereScaleUnit: 15,
        //     sphereFactor: 0.9,
        //     midStep: 0.25,
        //     midStepFactor: 0.05,
        //   },
        // };

        // // skeleton viewer
        // const skeletonView = new SkeletonViewer(
        //   skeletons[0],
        //   meshes[0],
        //   scene,
        //   true, //autoUpdateBoneMatrices?
        //   meshes[0].renderingGroupId > 0 ? meshes[0].renderingGroupId + 1 : 1, // renderingGroup
        //   SKELETON_VIEWER_OPTION
        // );
        // // babylon bug로 인해 초기 isEnabled를 true로 설정
        // skeletonView.isEnabled = true;
        //
        // setTimeout(() => {
        //   // sphere 및 spurs 지우기
        //   skeletonView.isEnabled = false;

        //   // skeleton 모드 변경
        //   skeletonView.changeDisplayMode(SkeletonViewer.DISPLAY_SPHERES);
        //   skeletonView.changeDisplayMode(SkeletonViewer.DISPLAY_LINES);
        //   skeletonView.changeDisplayMode(SkeletonViewer.DISPLAY_SPHERE_AND_SPURS)

        //   // joint 크기 조절
        //   skeletonView.changeDisplayOptions("sphereBaseSize", 0.5);
        // }, 2000);
      }

      // transformNodes
      if (transformNodes.length !== 0) {
        transformNodes.forEach((transformNode) => {
          scene.addTransformNode(transformNode);
        });
      }
    },
    [hasController]
  );

  useEffect(() => {
    if (gizmoManager) {
      // console.log("gizmoManager: ", gizmoManager);
      // console.log("gizmoAttachableMeshes: ", gizmoAttachableMeshes);
      gizmoManager.attachableMeshes = gizmoAttachableMeshes;
    }
  }, [gizmoAttachableMeshes, gizmoManager]);

  useEffect(() => {
    if (gizmoManager) {
      const handleKeyDown = (event) => {
        if (event.key === "w") {
          gizmoManager.positionGizmoEnabled = !gizmoManager.positionGizmoEnabled;
        }
        if (event.key === "e") {
          gizmoManager.rotationGizmoEnabled = !gizmoManager.rotationGizmoEnabled;
        }
        if (event.key === "r") {
          gizmoManager.scaleGizmoEnabled = !gizmoManager.scaleGizmoEnabled;
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  });

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

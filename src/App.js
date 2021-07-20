import { useCallback, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import { GLTF2Export } from "@babylonjs/serializers";
import axios from "axios";
import "./App.css";
import { useBabylon } from "./hooks";

function App() {
  const [currentFile, setCurrentFile] = useState();
  const renderingCanvas = useRef();

  const handleInputChange = (event) => {
    setCurrentFile(event.target.files[0]);
  };

  const { scene, loadedObjects, assetContainer } = useBabylon(
    currentFile,
    renderingCanvas
  );

  const handleGlbExport = useCallback(() => {
    if (scene && scene.isReady()) {
      GLTF2Export.GLBAsync(scene, "test").then((glb) => {
        glb.downloadFiles();
      });
    }
  }, [scene]);

  const handleFbxExport = useCallback(() => {
    if (scene && scene.isReady()) {
      const fileName = "test";
      GLTF2Export.GLBAsync(scene, fileName).then(async (glb) => {
        const blob = glb.glTFFiles[`${fileName}.glb`];
        const file = new File([blob], `${fileName}.glb`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "glb");
        formData.append("id", String(Date.now() / 1000));

        axios({
          method: "POST",
          url: "https://blenderapi.myplask.com:5000/glb2fbx-upload-api",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        })
          .then((res) => {
            const a = document.createElement("a");
            a.download = `${fileName}.fbx`;
            a.href = res.data.result;
            a.click();
          })
          .catch((err) => alert(err));
      });
    }
  }, [scene]);

  const handleLogScene = useCallback(() => {
    if (scene && scene.isReady()) {
      console.log("scene: ", scene);
    }
  }, [scene]);

  const startAllAnimations = useCallback(() => {
    if (scene && scene.isReady()) {
      loadedObjects.forEach((object) => {
        object.animationGroups.forEach((animationGroup) => {
          if (animationGroup.isStarted) {
            animationGroup.restart();
          } else {
            animationGroup.start();
          }
        });
      });
    }
  }, [loadedObjects, scene]);

  const pauseAllAnimations = useCallback(() => {
    if (scene && scene.isReady()) {
      loadedObjects.forEach((object) => {
        object.animationGroups.forEach((animationGroup) => {
          animationGroup.pause();
        });
      });
    }
  }, [loadedObjects, scene]);

  const handleLogAssetContainer = useCallback(() => {
    if (assetContainer) {
      console.log("assetContainer: ", assetContainer);
    }
  }, [assetContainer]);

  const attachAutoController = useCallback(() => {
    if (scene && scene.isReady()) {
      scene.skeletons.forEach((skeleton) => {
        // torus controller 부착
        skeleton.bones.forEach((bone, idx) => {
          if (bone.name !== "Scene") {
            const torusController = BABYLON.MeshBuilder.CreateTorus(
              "torusController",
              {
                diameter: bone.name === "Armature" ? 200 : 30,
                thickness: 0.5,
                tessellation: bone.name === "Armature" ? 64 : 32,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
              },
              scene
            );
            if (bone.name === "Armature") {
              torusController.rotate(new BABYLON.Vector3(1, 0, 0), Math.PI / 2);
            }
            torusController.boneIdx = idx;
            torusController.renderingGroupId = 3;
            torusController.renderOverlay = true;
            torusController.overlayColor = BABYLON.Color3.Purple();
            torusController.attachToBone(bone, skeleton.overrideMesh);
            // hover cursor 설정
            torusController.actionManager = new BABYLON.ActionManager(scene);
            torusController.actionManager.registerAction(
              new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                (event) => {
                  // const { source, meshUnderPointer } = event;
                  scene.hoverCursor = "pointer";
                }
              )
            );
            torusController.actionManager.registerAction(
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
      });
    }
  }, [scene]);

  const changeHipPositionAnimation = useCallback(() => {
    if (scene && scene.isReady()) {
      console.log("loadedObjects: ", loadedObjects);

      let loadedTransformNodes = [];
      loadedObjects.forEach(
        (objectData) =>
          (loadedTransformNodes = [
            ...loadedTransformNodes,
            ...objectData.transformNodes,
          ])
      );
      console.log(
        "hip transformNodes position: ",
        loadedTransformNodes
          .filter((node) => node.name.toLowerCase().includes("hip"))
          .map((node) => node.position)
      );

      const animationGroup = loadedObjects[0].animationGroups[0];
      const hipAnimatable = animationGroup.animatables.find(
        (anim) => anim.target.name === "mixamorig:Hips"
      );
      if (hipAnimatable) {
        const hipPositionAnimation = hipAnimatable.target.animations[0];
        // keys가 비어있는 경우 에러 발생 -> 키프레임 찍혀있지 않은 경우 재생 시, animation group에서 제외해야 함
        // index의 경우 늦게 시작은 가능하나, 빨리 끝낼 수는 없음(에러 발생)

        console.log(
          "hipPositionAnimation keys: ",
          hipPositionAnimation.getKeys()
        );
        const newKeys = [
          { frame: 0.5, value: hipAnimatable.target.position },
          { frame: 4.5, value: BABYLON.Vector3.Zero() },
        ];
        hipPositionAnimation.setKeys(newKeys);
        console.log(
          "hipPositionAnimation keys: ",
          hipPositionAnimation.getKeys()
        );
      }
    }
  }, [scene, loadedObjects]);

  // const handleToggleWireframeMode = useCallback(() => {
  //   if (scene && scene.isReady()) {
  //     scene.forceWireframe = !scene.forceWireframe;
  //   }
  // }, [scene]);

  return (
    <div className="app-container">
      <section>
        <h1>Animating Tool with Babylonjs</h1>
        <p className="description">
          You can use fbx and glb(glTF) format files.
          <br />
          The scene will not be re-rendered even after new file is loaded, on
          purpose.
          <br />
          It will take seconds for loading .fbx file. (Because of the api
          communication)
        </p>
        <ul className="how-to-use">
          <li>left click to rotate</li>
          <li>right click to pan</li>
          <li>wheel to zoom</li>
        </ul>
      </section>
      <input
        type="file"
        accept=".glb, .gltf, .fbx, .babylon"
        onChange={handleInputChange}
      />
      <canvas id="renderingCanvas" ref={renderingCanvas} />
      <div className="button-container">
        <button className="default-button" onClick={handleGlbExport}>
          export as glb
        </button>
        <button className="default-button" onClick={handleFbxExport}>
          export as fbx
        </button>
        <button className="default-button" onClick={handleLogScene}>
          log scene
        </button>
        <button className="default-button" onClick={startAllAnimations}>
          start all animations
        </button>
        <button className="default-button" onClick={pauseAllAnimations}>
          pause all animations
        </button>
        <button className="default-button" onClick={handleLogAssetContainer}>
          log assetContainer
        </button>
        {currentFile && (
          <>
            <button className="default-button" onClick={attachAutoController}>
              attach auto controller
            </button>
            <button
              className="default-button"
              onClick={changeHipPositionAnimation}
            >
              change hip position animation
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

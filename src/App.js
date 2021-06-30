import { GLTF2Export } from "babylonjs-serializers";
import { useCallback, useRef, useState } from "react";
import "./App.css";
import { useBabylon } from "./hooks";

function App() {
  const [currentFile, setCurrentFile] = useState();
  const renderingCanvas = useRef();

  const handleInputChange = (event) => {
    setCurrentFile(event.target.files[0]);
  };

  const { scene } = useBabylon(currentFile, renderingCanvas);

  const handleGlbExport = useCallback(() => {
    if (scene && scene.isReady()) {
      GLTF2Export.GLBAsync(scene, "test").then((glb) => {
        console.log("glb: ", glb);
        glb.downloadFiles();
      });
    }
  }, [scene]);

  const handleGltfExport = useCallback(() => {
    if (scene && scene.isReady()) {
      GLTF2Export.GLTFAsync(scene, "test").then((gltf) => {
        console.log("gltf: ", gltf);
        gltf.downloadFiles();
      });
    }
  }, [scene]);

  return (
    <div className="app-container">
      <section>
        <h1>Sample App with Babylon for Texture-Test</h1>
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
        accept=".glb, .gltf, .fbx"
        onChange={handleInputChange}
      />
      <canvas id="renderingCanvas" ref={renderingCanvas} />
      <div className="button-container">
        <button className="export-button" onClick={handleGlbExport}>
          export as glb
        </button>
        <button className="export-button" onClick={handleGltfExport}>
          export as gltf
        </button>
      </div>
    </div>
  );
}

export default App;

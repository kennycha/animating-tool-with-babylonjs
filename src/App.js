import { useRef, useState } from "react";
import "./App.css";
import { useBabylon } from "./hooks";

function App() {
  const [currentFile, setCurrentFile] = useState();
  const renderingCanvas = useRef();

  const handleInputChange = (event) => {
    setCurrentFile(event.target.files[0]);
  };

  useBabylon(currentFile, renderingCanvas.current);

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
    </div>
  );
}

export default App;

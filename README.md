# Animating Tool with Babylonjs

## Description

You can use fbx and glb(glTF) format files.

The scene will not be re-rendered even after new file is loaded, on purpose.

It will take seconds for loading .fbx file. (Because of the api communication)

## How to Control the Camera

- Left click to rotate.
- Right click to pan.
- Wheel to zoom.

## How to Control the Imported Model

- Left click joint spheres which you want to control, then the gizmo will be attached to the related bone.
- Change the type of the gizmo by pressing 'w', 'e', 'r' keys (default position gizmo).
- Detach the gizmo by pressing the 'Escape' key.
- Change the properties of target bone by dragging the gizmo.

<video src="./public/assets/sample-video.mov"></video>

// import * as BABYLON from "@babylonjs/core";

// class SkeletonWidget {
//   _rootNode = null;
//   _scene = null;
//   _skeleton = null;

//   constructor(rootNode, scene, skeleton, options) {
//     this._rootNode = rootNode;
//     this._scene = scene;
//     this._skeleton = skeleton;
//     this.finalMesh = null;

//     this.spherePointBaseSize = options.spherePointBaseSize;
//     this.spherePointMinSize = options.spherePointMinSize;
//     this.boneMeshHalfwayRatio = options.boneMeshHalfwayRatio;
//     this.boneMeshHalfwayScale = options.boneMeshHalfwayScale;

//     this.longestBoneLength = Number.NEGATIVE_INFINITY;
//   }

//   build(show = true) {
//     this.dispose();

//     const bones = this._skeleton.bones;
//     const scene = this._scene;

//     const anchorSpheres = [];
//     const spurs = [];

//     for (let idx = 0; idx < bones.length; idx += 1) {
//       const bone = bones[idx];

//       if (bone.name === "Scene" || bone.name === "Armature") {
//         continue;
//       }

//       // const isMappedBone = bone.boneID !== undefined ? true : false;
//       // const isExtensionBone =
//       //   bone.extensionOfBoneID !== undefined ? true : false;
//       // const isEndBone = bone.children.length ? true : false;

//       const anchorPoint = bone.getAbsolutePosition();

//       bone.children.forEach((boneChild, i) => {
//         boneChild.parentIdx = idx;
//         const childPoint = boneChild.getAbsolutePosition();
//         const distanceFromParent = BABYLON.Vector3.Distance(
//           anchorPoint,
//           childPoint
//         );
//         if (distanceFromParent > this.longestBoneLength) {
//           this.longestBoneLength = distanceFromParent;
//         }
//         boneChild.distanceFromParent = distanceFromParent;

//         const dir = childPoint.clone().subtract(anchorPoint.clone());
//         const h = dir.length();
//         const up = dir.normalize().scale(h);

//         const up0 = up.scale(this.boneMeshHalfwayRatio);

//         const spur = BABYLON.MeshBuilder.ExtrudeShapeCustom(
//           boneChild.name + ":spur",
//           {
//             shape: [
//               new BABYLON.Vector3(1, -1, 0),
//               new BABYLON.Vector3(1, 1, 0),
//               new BABYLON.Vector3(-1, 1, 0),
//               new BABYLON.Vector3(-1, -1, 0),
//               new BABYLON.Vector3(1, -1, 0),
//             ],
//             path: [BABYLON.Vector3.Zero(), up0, up],
//             scaleFunction: (i) => {
//               switch (i) {
//                 case 0:
//                 case 2:
//                   return 0;
//                 case 1:
//                   return h * this.boneMeshHalfwayScale;
//                 default:
//                   return;
//               }
//             },
//             sideOrientation: BABYLON.Mesh.FRONTSIDE,
//             updatable: true,
//           },
//           scene
//         );

//         const ind = spur.getIndices();
//         const mwk = [],
//           mik = [];

//         for (let i = 0; i < ind.length; i += 1) {
//           mwk.push(1, 0, 0, 0);
//           mik.push(idx, 0, 0, 0);
//         }
//         spur.setAbsolutePosition(anchorPoint);
//         spur.setVerticesData(
//           BABYLON.VertexBuffer.MatricesWeightsKind,
//           mwk,
//           false
//         );
//         spur.setVerticesData(
//           BABYLON.VertexBuffer.MatricesIndicesKind,
//           mik,
//           false
//         );

//         spurs.push(spur);
//       });

//       const anchorSphere = BABYLON.MeshBuilder.CreateSphere(
//         "anchorSphere",
//         {
//           segments: 12,
//           diameter: this.spherePointBaseSize,
//           updatable: true,
//         },
//         scene
//       );

//       const ind = anchorSphere.getIndices();
//       const mwk = [],
//         mik = [];

//       for (let i = 0; i < ind.length; i += 1) {
//         mwk.push(1, 0, 0, 0);
//         mik.push(idx, 0, 0, 0);
//       }

//       anchorSphere.setVerticesData(
//         BABYLON.VertexBuffer.MatricesWeightsKind,
//         mwk,
//         false
//       );
//       anchorSphere.setVerticesData(
//         BABYLON.VertexBuffer.MatricesIndicesKind,
//         mik,
//         false
//       );

//       anchorSphere.boneIdx = idx;
//       anchorSphere.position = anchorPoint.clone();
//       anchorSpheres.push(anchorSphere);
//     }

//     for (let i = 0; i < anchorSpheres.length; i += 1) {
//       const anchorSphere = anchorSpheres[i];
//       const b = bones[anchorSphere.boneIdx];
//       if (b.parentIdx !== undefined) {
//         const factor =
//           ((b.distanceFromParent / this.longestBoneLength) *
//             (this.spherePointBaseSize - this.spherePointMinSize) +
//             this.spherePointMinSize) /
//           this.spherePointBaseSize;
//         anchorSphere.scaling.scaleInPlace(factor);
//       }
//     }

//     anchorSpheres.forEach((sphere, idx) => {
//       sphere.renderingGroupId = 3;
//       scene.addMesh(sphere);
//       sphere.attachToBone(bones[sphere.boneIdx], this._rootNode);
//       scene.onPointerObservable.add((pointerInfo, eventState) => {
//         const { pickInfo } = pointerInfo;
//         if (pickInfo.hit && pickInfo.pickedMesh === sphere) {
//           console.log(`sphere-${idx}`, sphere);
//           console.log("mapping bone: ", bones[sphere.boneIdx]);
//         }
//       }, BABYLON.PointerEventTypes.POINTERPICK);
//     });

//     spurs.forEach((spur, idx) => {
//       spur.renderingGroupId = 3;
//       scene.addMesh(spur);
//       scene.onPointerObservable.add((pointerInfo, eventState) => {
//         const { pickInfo } = pointerInfo;
//         if (pickInfo.hit && pickInfo.pickedMesh === spur) {
//           console.log(`spur-${idx}`, spur);
//         }
//       }, BABYLON.PointerEventTypes.POINTERPICK);
//     });

//     this.finalMesh = BABYLON.Mesh.MergeMeshes(
//       [this._rootNode, ...spurs],
//       true,
//       true,
//       false,
//       false,
//       false
//     );
//     // this.finalMesh = BABYLON.Mesh.MergeMeshes(
//     //   anchorSpheres.concat(spurs),
//     //   true,
//     //   true,
//     //   false,
//     //   false,
//     //   false
//     // );

//     // this.finalMesh.renderingGroupId = 3;
//     // this.finalMesh.skeleton = this._skeleton;
//   }

//   // show(state) {}

//   dispose() {
//     if (this.finalMesh) {
//       this.finalMesh.dispose();
//       this.finalMesh = null;
//     }
//   }

//   // get rootNode() {
//   //   return this._rootNode;
//   // }
//   // get skeleton() {
//   //   return this._skeleton;
//   // }
// }

// export default SkeletonWidget;

import * as BABYLON from "@babylonjs/core";

const logBonesDirections = (bones, rootMesh) => {
  bones.forEach((bone) => {
    console.log("bone name: ", bone.name);
    const directionX = bone.getDirection(new BABYLON.Vector3(1, 0, 0));
    const directionXWithTNode = bone.getDirection(
      new BABYLON.Vector3(1, 0, 0),
      rootMesh
    );

    const directionY = bone.getDirection(new BABYLON.Vector3(0, 1, 0));
    const directionYWithTNode = bone.getDirection(
      new BABYLON.Vector3(0, 1, 0),
      rootMesh
    );

    const directionZ = bone.getDirection(new BABYLON.Vector3(0, 0, 1));
    const directionZWithTNode = bone.getDirection(
      new BABYLON.Vector3(0, 0, 1),
      rootMesh
    );
    console.log(
      "dirX: ",
      Math.round(directionX.x * 100) / 100,
      Math.round(directionX.y * 100) / 100,
      Math.round(directionX.z * 100) / 100
    );
    console.log(
      "dirY: ",
      Math.round(directionY.x * 100) / 100,
      Math.round(directionY.y * 100) / 100,
      Math.round(directionY.z * 100) / 100
    );
    console.log(
      "dirZ: ",
      Math.round(directionZ.x * 100) / 100,
      Math.round(directionZ.y * 100) / 100,
      Math.round(directionZ.z * 100) / 100
    );
    console.log(
      "dirXWithTNode: ",
      Math.round(directionXWithTNode.x * 100) / 100,
      Math.round(directionXWithTNode.y * 100) / 100,
      Math.round(directionXWithTNode.z * 100) / 100
    );
    console.log(
      "dirYWithTNode: ",
      Math.round(directionYWithTNode.x * 100) / 100,
      Math.round(directionYWithTNode.y * 100) / 100,
      Math.round(directionYWithTNode.z * 100) / 100
    );
    console.log(
      "dirZWithTNode: ",
      Math.round(directionZWithTNode.x * 100) / 100,
      Math.round(directionZWithTNode.y * 100) / 100,
      Math.round(directionZWithTNode.z * 100) / 100
    );
  });
};

export default logBonesDirections;

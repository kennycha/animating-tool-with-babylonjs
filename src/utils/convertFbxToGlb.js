import axios from "axios";

const BASE_URL = "https://blenderapi.myplask.com:5000";

const convertFbxToGlb = async (fbxFile) => {
  const formData = new FormData();
  formData.append("file", fbxFile);
  formData.append("type", "fbx");
  formData.append("id", String(Date.now() / 1000));

  const result = await axios({
    method: "POST",
    baseURL: BASE_URL,
    url: "/fbx2glb-upload-api",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((result) => result.data.result)
    .catch((error) => {
      throw error;
    });

  return result;
};

export default convertFbxToGlb;

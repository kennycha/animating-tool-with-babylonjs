const getFileExtension = (file) => {
  if (file) {
    const { name } = file;
    if (name) {
      if (name.includes(".")) {
        return name
          .substring(name.lastIndexOf(".") + 1, name.length)
          .toLowerCase();
      } else {
        throw new Error("Invalid file extension");
      }
    } else {
      throw new Error("File doesn't have a name");
    }
  } else {
    throw new Error("File doesn't exist");
  }
};

export default getFileExtension;

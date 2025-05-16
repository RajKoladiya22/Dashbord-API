// // src/core/middleware/multer/fileUpload.ts
// import multer from "multer";
// import path from "path";

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, path.resolve(__dirname, "../../../../uploads"));
//   },
//   filename: (_req, file, cb) => {
//     const name = path.basename(file.originalname, path.extname(file.originalname));
//     cb(null, `${name}-${Date.now()}${path.extname(file.originalname)}`);
//   },
// });

// export const upload = multer({
//   storage,
//   fileFilter: (_req, file, cb) => {
//     const allowed = [".csv", ".xls", ".xlsx"];
//     cb(
//       null,
//       allowed.includes(path.extname(file.originalname).toLowerCase())
//     );
//   },
//   limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
// });


import multer from "multer";

const storage = multer.memoryStorage();    // ↪ in‑memory only

export const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = [".csv", ".xls", ".xlsx"];
    cb(null, allowed.includes(file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 }    // 5 MB max
});
// src/types/express/index.d.ts
import 'express';
import { File as MulterFile } from 'multer';

declare module 'express-serve-static-core' {
  interface Request {
    /** Single‐file upload via multer */
    file?: MulterFile;
    /** Multi‐file uploads or fields with multiple files */
    files?: MulterFile[] | Record<string, MulterFile[]>;
  }
}

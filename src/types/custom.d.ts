// import { IUser } from '../core/utils/interface'; // Adjust the path to where your IUser interface is defined
// import { Request } from 'express';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: IUser; // Attach user object to the request
//     }
//   }
// }

// src/@types/express/index.d.ts
import { IUser } from '../../core/utils/interface';      // adjust path as needed
import { Request as _Request } from 'express';
import * as multer from 'multer';

declare global {
  namespace Express {
    interface Request {
      // your existing user property
      user?: IUser;

      // multer adds these at runtime
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
      
      // if you also read cookies
      cookies: Record<string, string>;
    }
  }
}

// needed so TS treats this as a module
export {};

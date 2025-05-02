import { IUser } from '../core/utils/interface'; // Adjust the path to where your IUser interface is defined
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Attach user object to the request
    }
  }
}

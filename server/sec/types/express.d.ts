export interface IAuthUser {
    userId: string
    email: string
    role: UserRole
  }
  
  declare global {
    namespace Express {
      interface Request {
        user?: IAuthUser
        files?: Multer.File[];
        file?: Multer.File;

      }
    }
  }
  
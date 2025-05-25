declare module 'express-basic-auth' {
  import { RequestHandler } from 'express';
  
  interface BasicAuthOptions {
    users?: { [username: string]: string };
    challenge?: boolean;
    realm?: string;
    authorizer?: (username: string, password: string) => boolean;
    authorizeAsync?: boolean;
    unauthorizedResponse?: any;
  }
  
  function basicAuth(options: BasicAuthOptions): RequestHandler;
  export = basicAuth;
} 
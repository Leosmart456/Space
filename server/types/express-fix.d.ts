export {};

declare module 'express-serve-static-core' {
  interface Express {
    use: (...args: any[]) => any;
    get: (...args: any[]) => any;
    post: (...args: any[]) => any;
    put: (...args: any[]) => any;
    delete: (...args: any[]) => any;
    patch: (...args: any[]) => any;
    all: (...args: any[]) => any;
    handle: (req: any, res: any, next?: any) => void;
  }
  interface Application {
    use: (...args: any[]) => any;
    get: (...args: any[]) => any;
    post: (...args: any[]) => any;
    put: (...args: any[]) => any;
    delete: (...args: any[]) => any;
    patch: (...args: any[]) => any;
    all: (...args: any[]) => any;
    handle: (req: any, res: any, next?: any) => void;
  }
  interface Request {
    headers: any;
    url: string;
    path: string;
    method: string;
    rawBody?: any;
    originalUrl: string;
  }
  interface Response {
    redirect: (...args: any[]) => any;
    json: (body?: any) => any;
    status: (code: number) => any;
    on: (...args: any[]) => any;
    statusCode: number;
    headersSent: boolean;
  }
}

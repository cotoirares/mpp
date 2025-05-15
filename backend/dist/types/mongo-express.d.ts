declare module 'mongo-express/lib/middleware' {
  interface MongoExpressConfig {
    mongodb: {
      connectionString: string;
      adminUsername?: string;
      adminPassword?: string;
      basicAuth?: {
        username: string;
        password: string;
      };
      options?: {
        useNewUrlParser?: boolean;
        useUnifiedTopology?: boolean;
      };
    };
    site: {
      baseUrl: string;
      port: number;
      cookieSecret: string;
    };
    options?: {
      useNewUrlParser?: boolean;
      useUnifiedTopology?: boolean;
    };
  }

  function middleware(config: MongoExpressConfig): any;
  export = middleware;
} 
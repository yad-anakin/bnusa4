// Node.js process global object
declare namespace NodeJS {
  interface Process {
    env: ProcessEnv;
  }
  
  interface ProcessEnv {
    [key: string]: string | undefined;
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_SITE_URL?: string;
  }
}

declare var process: NodeJS.Process;

// For CommonJS compatibility
declare module "process" {
  export = process;
} 
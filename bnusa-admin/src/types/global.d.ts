// React and React DOM types
import * as React from 'react';
import * as ReactDOM from 'react-dom';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Next.js modules
declare module 'next/link' {
  import { ComponentType } from 'react';
  
  interface LinkProps {
    href: string;
    as?: string;
    prefetch?: boolean;
    scroll?: boolean;
    replace?: boolean;
    shallow?: boolean;
    locale?: string | false;
    [key: string]: any;
  }
  
  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string, options?: any) => void;
    replace: (url: string, options?: any) => void;
    back: () => void;
    prefetch: (url: string) => void;
    pathname: string;
    query: Record<string, string | string[]>;
  };

  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

// Heroicons modules
declare module '@heroicons/react/24/outline' {
  import { ComponentType } from 'react';
  
  interface IconProps {
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
    [key: string]: any;
  }
  
  export const UserCircleIcon: ComponentType<IconProps>;
  export const PencilIcon: ComponentType<IconProps>;
  export const TrashIcon: ComponentType<IconProps>;
  export const DocumentTextIcon: ComponentType<IconProps>;
  export const EyeIcon: ComponentType<IconProps>;
  export const Bars3Icon: ComponentType<IconProps>;
  export const BellIcon: ComponentType<IconProps>;
  export const ArrowRightOnRectangleIcon: ComponentType<IconProps>;
  export const Cog6ToothIcon: ComponentType<IconProps>;
  export const XMarkIcon: ComponentType<IconProps>;
  export const HomeIcon: ComponentType<IconProps>;
  export const UsersIcon: ComponentType<IconProps>;
  export const NewspaperIcon: ComponentType<IconProps>;
  export const ChartBarIcon: ComponentType<IconProps>;
  export const CheckCircleIcon: ComponentType<IconProps>;
  export const ExclamationCircleIcon: ComponentType<IconProps>;
}

// Axios module
declare module 'axios' {
  interface AxiosRequestConfig {
    baseURL?: string;
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    params?: any;
    data?: any;
    timeout?: number;
    withCredentials?: boolean;
    auth?: {
      username: string;
      password: string;
    };
    responseType?: string;
    [key: string]: any;
  }

  interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: AxiosRequestConfig;
    request?: any;
  }

  interface AxiosError<T = any> extends Error {
    config: AxiosRequestConfig;
    code?: string;
    request?: any;
    response?: AxiosResponse<T>;
  }

  interface AxiosInstance {
    (config: AxiosRequestConfig): Promise<AxiosResponse>;
    (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse>;
    defaults: AxiosRequestConfig;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    interceptors: {
      request: any;
      response: any;
    };
  }

  interface AxiosStatic extends AxiosInstance {
    create(config?: AxiosRequestConfig): AxiosInstance;
    all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
    spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
    isAxiosError(payload: any): payload is AxiosError;
  }

  const axios: AxiosStatic;
  export default axios;
}

// Global type definitions

declare global {
  // Ensure React is globally available
  namespace React {
    type ReactNode = 
      | string
      | number
      | boolean
      | null
      | undefined
      | React.ReactElement
      | React.ReactFragment
      | React.ReactPortal
      | React.PromiseLikeOfReactNode
      | Iterable<React.ReactNode>;
  }

  // Next.js types
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_SITE_URL: string;
    }
  }
}

export {}; 
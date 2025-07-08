// Type declarations for Next.js
declare module 'next' {
  import React from 'react';
  
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: any;
  }
}

declare module 'next/font/google' {
  interface FontOptions {
    weight?: string | string[];
    style?: string | string[];
    subsets?: string[];
    display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
    [key: string]: any;
  }

  export function Inter(options: FontOptions): {
    className: string;
    style: { [key: string]: any };
  };
} 
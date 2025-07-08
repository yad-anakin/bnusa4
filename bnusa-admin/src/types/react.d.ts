// Type definitions for React 18.0
// Project: React (https://reactjs.org/)
// Provides types for ESM and non-ESM import styles

import React from 'react';

// Re-export all React hooks
declare module 'react' {
  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useContext: typeof React.useContext;
  export const useReducer: typeof React.useReducer;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useRef: typeof React.useRef;
  export const useImperativeHandle: typeof React.useImperativeHandle;
  export const useLayoutEffect: typeof React.useLayoutEffect;
  export const useDebugValue: typeof React.useDebugValue;
  export const useDeferredValue: typeof React.useDeferredValue;
  export const useTransition: typeof React.useTransition;
  export const useId: typeof React.useId;
  export const useSyncExternalStore: typeof React.useSyncExternalStore;
  export const useInsertionEffect: typeof React.useInsertionEffect;
  
  // Types
  export type ReactNode = React.ReactNode;
  export type ReactElement = React.ReactElement;
  export type ComponentType<P = {}> = React.ComponentType<P>;
  export type FC<P = {}> = React.FC<P>;
  export type PropsWithChildren<P = {}> = React.PropsWithChildren<P>;
  export type MouseEvent<T = Element> = React.MouseEvent<T>;
  export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
  export type FormEvent<T = Element> = React.FormEvent<T>;
} 
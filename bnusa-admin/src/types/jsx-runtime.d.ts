// Fix React JSX errors
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Global declarations
declare global {
  namespace React {
    interface ReactElement {
      type: any;
      props: any;
      key: any;
    }
    
    interface ReactNode {
      children?: ReactNode[] | ReactNode;
    }
    
    type ComponentType<P = {}> = any;
    type Component<P = {}, S = {}> = any;
    type FormEvent<T = Element> = any;
    type ChangeEvent<T = Element> = any;
    type MouseEvent<T = Element> = any;
    type KeyboardEvent<T = Element> = any;
    type FocusEvent<T = Element> = any;
    type ComponentProps<T> = any;
  }
}

export {};

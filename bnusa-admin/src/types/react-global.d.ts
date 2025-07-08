import React from 'react';

declare global {
  // Make React available globally
  const React: typeof import('react');
  
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {}
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
} 
declare module 'react-chartjs-2' {
  import { ChartData, ChartOptions } from 'chart.js';
  import * as React from 'react';

  interface ChartComponentProps {
    data: ChartData;
    options?: ChartOptions;
    plugins?: any[];
    type?: string;
    height?: number;
    width?: number;
    id?: string;
    className?: string;
    redraw?: boolean;
    fallbackContent?: React.ReactNode;
  }

  export class Line extends React.Component<ChartComponentProps> {}
  export class Bar extends React.Component<ChartComponentProps> {}
  export class Pie extends React.Component<ChartComponentProps> {}
  export class Doughnut extends React.Component<ChartComponentProps> {}
  export class Radar extends React.Component<ChartComponentProps> {}
  export class PolarArea extends React.Component<ChartComponentProps> {}
  export class Bubble extends React.Component<ChartComponentProps> {}
  export class Scatter extends React.Component<ChartComponentProps> {}
} 
declare module 'chart.js' {
  interface ChartData {
    labels?: any[];
    datasets: any[];
  }

  interface ChartOptions {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    scales?: {
      x?: any;
      y?: any;
    };
    plugins?: {
      legend?: any;
      title?: any;
      tooltip?: any;
    };
    [prop: string]: any;
  }

  class Chart {
    static register(...args: any[]): void;
    constructor(context: any, config: any);
    update(): void;
    destroy(): void;
    toBase64Image(): string;
    static getChart(id: string): Chart | undefined;
    resize(width?: number, height?: number): void;
  }

  export { Chart };
  export class CategoryScale {}
  export class LinearScale {}
  export class PointElement {}
  export class LineElement {}
  export class BarElement {}
  export class Title {}
  export class Tooltip {}
  export class Legend {}
  export class ArcElement {}
} 
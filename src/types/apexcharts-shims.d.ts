declare module 'apexcharts' {
  export type ApexOptions = Record<string, any>;

  class ApexCharts {
    constructor(el: any, options: any);
    render(): Promise<void>;
    destroy(): void;
  }

  export default ApexCharts;
}

declare module 'react-apexcharts' {
  import * as React from 'react';

  const ReactApexChart: React.ComponentType<any>;
  export default ReactApexChart;
}

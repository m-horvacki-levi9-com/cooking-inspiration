/// <reference types="vite/client" />

interface BringImportWidgetConfig {
  url: string;
  version?: string;
  language?: string;
  theme?: string;
  baseQuantity?: string;
  requestedQuantity?: string;
}

interface Window {
  bringwidgets?: {
    import?: {
      render: (element: HTMLElement, config: BringImportWidgetConfig) => void;
    };
  };
}

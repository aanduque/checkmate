/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ionicons web component declarations for React JSX
// Note: ion-icon uses 'class' not 'className' as it's a web component
declare namespace JSX {
  interface IntrinsicElements {
    'ion-icon': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        name: string;
        class?: string;
        size?: string;
        color?: string;
        slot?: string;
        style?: React.CSSProperties;
        onClick?: () => void;
      },
      HTMLElement
    >;
  }
}

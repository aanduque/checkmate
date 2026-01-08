// Type definitions for Ionicons custom elements
declare namespace JSX {
  interface IntrinsicElements {
    'ion-icon': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        name?: string;
        size?: string;
        color?: string;
        src?: string;
        icon?: string;
        class?: string;
      },
      HTMLElement
    >;
  }
}

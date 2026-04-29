import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "metabase-dashboard": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          token?: string;
          "with-title"?: string;
          "with-downloads"?: string;
          style?: React.CSSProperties; // Ahora incluimos el estilo aquí
        },
        HTMLElement
      >;
    }
  }
}
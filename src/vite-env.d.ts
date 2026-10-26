/// <reference types="vite/client" />

declare module 'lucide-react' {
  import React from 'react';
  const icons: Record<string, React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }>>;
  export = icons;
}

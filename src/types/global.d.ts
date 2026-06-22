/**
 * Global type definitions
 */

declare global {
  interface Window {
    __sudoku_adaptive_height_installed?: boolean;
  }

  interface ImportMeta {
    readonly env: {
      readonly BASE_URL: string;
      readonly DEV: boolean;
      readonly VITE_DEV_PASSWORD: string;
    };
  }
}

export {};

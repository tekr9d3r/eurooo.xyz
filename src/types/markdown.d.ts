declare module '*.md' {
  export const html: string;
  export const toc: { level: string; content: string }[];
  export const attributes: Record<string, unknown>;
}

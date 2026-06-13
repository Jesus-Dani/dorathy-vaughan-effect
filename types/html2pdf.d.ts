declare module 'html2pdf.js' {
  const html2pdf: () => {
    set: (options: Record<string, unknown>) => ReturnType<typeof html2pdf>;
    from: (element: HTMLElement) => ReturnType<typeof html2pdf>;
    save: () => Promise<void>;
  };
  export default html2pdf;
}

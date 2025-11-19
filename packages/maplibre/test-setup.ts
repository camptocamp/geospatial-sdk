if (typeof window.URL.createObjectURL === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).URL.createObjectURL = () => {};
}

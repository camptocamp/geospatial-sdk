class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).ResizeObserver = ResizeObserverMock;

if (typeof window.URL.createObjectURL === "undefined") {
  (window as any).URL.createObjectURL = () => {};
}

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).ResizeObserver = ResizeObserverMock;

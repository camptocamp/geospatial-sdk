class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
}

(window as any).ResizeObserver = ResizeObserverMock;

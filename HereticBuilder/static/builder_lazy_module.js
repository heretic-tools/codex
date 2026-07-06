function lazyModule(importModule) {
  let promise = null;
  return () => {
    if (!promise) {
      promise = importModule();
    }
    return promise;
  };
}

export { lazyModule };

function isIgnorableBullTeardownError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes(
      "Cannot read properties of undefined (reading 'message')",
    ) &&
    (error.stack?.includes('bull/lib/worker.js') ?? false)
  );
}

process.on('uncaughtException', (error) => {
  if (isIgnorableBullTeardownError(error)) {
    return;
  }

  setImmediate(() => {
    throw error;
  });
});

process.on('unhandledRejection', (reason) => {
  if (isIgnorableBullTeardownError(reason)) {
    return;
  }

  const error = reason instanceof Error ? reason : new Error(String(reason));
  setImmediate(() => {
    throw error;
  });
});

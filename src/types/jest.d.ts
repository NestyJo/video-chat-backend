/// <reference types="jest" />

// This file ensures Jest types are available throughout the project
// It extends the global Jest namespace if needed

declare global {
  namespace jest {
    interface Matchers<R> {
      // Add any custom Jest matchers here if needed in the future
    }
  }
}

export {};
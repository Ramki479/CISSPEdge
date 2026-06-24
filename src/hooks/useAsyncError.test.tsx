import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAsyncError } from './useAsyncError';

/* ─── Test helper components ─────────────────────────────────────────────── */

/** Throws on button click. */
function ClickErrorThrower({ message = 'Click error' }: { message?: string }) {
  const { throwError } = useAsyncError();
  return (
    <button onClick={() => throwError(new Error(message))}>
      Throw Error
    </button>
  );
}

/** Throws inside a useEffect on mount. */
function MountErrorThrower({ message = 'Mount error' }: { message?: string }) {
  const { throwError } = useAsyncError();
  useEffect(() => {
    throwError(new Error(message));
  }, []);
  return <div data-testid="never-shown">Should not render</div>;
}

/** Throws with a string value (not an Error). */
function StringErrorThrower({ message = 'string reason' }: { message?: string }) {
  const { throwError } = useAsyncError();
  return (
    <button onClick={() => throwError(message)}>
      Throw String
    </button>
  );
}

/** A safe child that does not throw. */
function SafeChild() {
  return <div data-testid="safe-child">Safe content</div>;
}

/* ─── Test suite ─────────────────────────────────────────────────────────── */

describe('useAsyncError', () => {
  beforeEach(() => {
    // React logs thrown errors to console.error even when caught by error
    // boundaries; suppress to keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  /* ── Catches errors from user interaction ─────────────────────────────── */

  describe('error from user interaction', () => {
    it('throws an Error that is caught by the ErrorBoundary', async () => {
      const user = userEvent.setup();
      render(
        <ErrorBoundary fallbackTitle="Data Retrieval Error">
          <ClickErrorThrower />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Throw Error')).toBeInTheDocument();

      await user.click(screen.getByText('Throw Error'));

      // Error boundary fallback should appear
      expect(screen.getByText('Data Retrieval Error')).toBeInTheDocument();
      // The error message should be visible in the trace panel
      expect(screen.getByText('Click error')).toBeInTheDocument();
      // Retry action should be present
      expect(screen.getByText('◈ Retry')).toBeInTheDocument();
    });

    it('does NOT render children after catching an error', async () => {
      const user = userEvent.setup();
      render(
        <ErrorBoundary fallbackTitle="Error">
          <ClickErrorThrower />
          <SafeChild />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('safe-child')).toBeInTheDocument();

      await user.click(screen.getByText('Throw Error'));

      // Safe child should NOT be rendered after error
      expect(screen.queryByTestId('safe-child')).not.toBeInTheDocument();
    });
  });

  /* ── Catches errors thrown during mount (useEffect) ───────────────────── */

  describe('error during mount (useEffect)', () => {
    it('catches errors thrown from useEffect and shows fallback', async () => {
      render(
        <ErrorBoundary fallbackTitle="Data Retrieval Error">
          <MountErrorThrower />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Data Retrieval Error')).toBeInTheDocument();
      expect(screen.getByText('Mount error')).toBeInTheDocument();
    });

    it('shows the error boundary and not the throwing component', async () => {
      render(
        <ErrorBoundary fallbackTitle="Error Occurred">
          <MountErrorThrower />
        </ErrorBoundary>,
      );

      expect(screen.queryByTestId('never-shown')).not.toBeInTheDocument();
      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    });
  });

  /* ── Handles non-Error values ─────────────────────────────────────────── */

  describe('non-Error values', () => {
    it('wraps a string in an Error and shows its message', async () => {
      const user = userEvent.setup();
      render(
        <ErrorBoundary fallbackTitle="Error">
          <StringErrorThrower message="network failure" />
        </ErrorBoundary>,
      );

      await user.click(screen.getByText('Throw String'));

      expect(screen.getByText('network failure')).toBeInTheDocument();
    });

    it('wraps a number in an Error', async () => {
      const user = userEvent.setup();
      function NumErrorThrower() {
        const { throwError } = useAsyncError();
        return (
          <button onClick={() => throwError(500)}>Throw Number</button>
        );
      }
      render(
        <ErrorBoundary fallbackTitle="Error">
          <NumErrorThrower />
        </ErrorBoundary>,
      );

      await user.click(screen.getByText('Throw Number'));

      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  /* ── Retry resets the boundary ────────────────────────────────────────── */

  describe('retry behaviour', () => {
    it('resets the error boundary and re-renders children after clicking Retry', async () => {
      const user = userEvent.setup();
      render(
        <ErrorBoundary fallbackTitle="Error">
          <ClickErrorThrower message="retry test" />
        </ErrorBoundary>,
      );

      // Trigger error
      await user.click(screen.getByText('Throw Error'));
      expect(screen.getByText('retry test')).toBeInTheDocument();

      // Click Retry
      await user.click(screen.getByText('◈ Retry'));

      // Children should be back
      expect(screen.getByText('Throw Error')).toBeInTheDocument();
      // Error boundary fallback should be gone
      expect(screen.queryByText('◈ Retry')).not.toBeInTheDocument();
    });
  });
});

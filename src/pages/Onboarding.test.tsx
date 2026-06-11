import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockInitializeUserProgress = vi.fn()

vi.mock('../data/database', () => ({
  initializeUserProgress: (...args: unknown[]) =>
    mockInitializeUserProgress(...args),
}))

// ─── Test suite ────────────────────────────────────────────────────────────────

describe('Onboarding', () => {
  // Keep references to spied globals so we can assert on them
  let alertSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Spy on global browser APIs
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Default: init resolves successfully
    mockInitializeUserProgress.mockResolvedValue(undefined)
  })

  // ── Rendering ────────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the heading and tagline', () => {
      render(<Onboarding />)
      expect(screen.getByText('CISSP Preparation Coach')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Your personalized offline guide to CISSP certification success',
        ),
      ).toBeInTheDocument()
    })

    it('renders all three level cards', () => {
      render(<Onboarding />)
      expect(screen.getByText('Beginner')).toBeInTheDocument()
      expect(screen.getByText('Intermediate')).toBeInTheDocument()
      expect(screen.getByText('Expert')).toBeInTheDocument()
    })

    it('renders the start button with default text', () => {
      render(<Onboarding />)
      const btn = screen.getByRole('button', { name: /select your level/i })
      expect(btn).toBeInTheDocument()
      expect(btn).not.toBeDisabled()
    })
  })

  // ── Level selection ──────────────────────────────────────────────────────────

  describe('level selection', () => {
    it('visually highlights the clicked card', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      const beginnerBtn = screen.getByRole('button', { name: /beginner/i })

      // Before click – card should NOT have the selected border class
      expect(beginnerBtn.className).not.toContain('border-indigo-500')

      await user.click(beginnerBtn)

      // After click – card should have the selected styling
      expect(beginnerBtn.className).toContain('border-indigo-500')
    })

    it('updates button text to "Begin Your Journey" after selection', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      // Initially the button says "Select Your Level"
      expect(
        screen.getByRole('button', { name: /select your level/i }),
      ).toBeInTheDocument()

      // Click a level card
      await user.click(screen.getByRole('button', { name: /beginner/i }))

      // Button text should now be "Begin Your Journey →"
      expect(
        screen.getByRole('button', { name: /begin your journey/i }),
      ).toBeInTheDocument()
    })

    it('removes highlight from previously selected card when another is clicked', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      const beginnerBtn = screen.getByRole('button', { name: /beginner/i })
      const intermediateBtn = screen.getByRole('button', { name: /intermediate/i })

      await user.click(beginnerBtn)
      expect(beginnerBtn.className).toContain('border-indigo-500')

      await user.click(intermediateBtn)
      expect(beginnerBtn.className).not.toContain('border-indigo-500')
      expect(intermediateBtn.className).toContain('border-indigo-500')
    })
  })

  // ── Alert on no level selected ───────────────────────────────────────────────

  describe('alert when no level is selected', () => {
    it('shows an alert when "Begin Your Journey" is clicked with no selection', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      // "Begin Your Journey" text is NOT shown because no level is selected;
      // the button text is "Select Your Level", but it's the same button we click.
      const btn = screen.getByRole('button', { name: /select your level/i })
      await user.click(btn)

      expect(alertSpy).toHaveBeenCalledTimes(1)
      expect(alertSpy).toHaveBeenCalledWith(
        'Please select a learning level to continue.',
      )
    })

    it('does NOT call navigate when no level is selected', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /select your level/i }))

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('does NOT call initializeUserProgress when no level is selected', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /select your level/i }))

      expect(mockInitializeUserProgress).not.toHaveBeenCalled()
    })
  })

  // ── Navigation per level ─────────────────────────────────────────────────────

  describe.each([
    { level: 'beginner', expectedPath: '/learning-path/beginner' },
    { level: 'intermediate', expectedPath: '/learning-path/intermediate' },
    { level: 'expert', expectedPath: '/learning-path/expert' },
  ])('navigation for $level level', ({ level, expectedPath }) => {
    it(`navigates to ${expectedPath} after selecting ${level} and clicking the button`, async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      // Click the level card
      const levelBtn = screen.getByRole('button', {
        name: new RegExp(`${level}`, 'i'),
      })
      await user.click(levelBtn)

      // Click "Begin Your Journey" button
      await user.click(
        screen.getByRole('button', { name: /begin your journey/i }),
      )

      // Should have called initializeUserProgress with the level
      expect(mockInitializeUserProgress).toHaveBeenCalledWith(level)

      // Should have navigated to the correct path
      expect(mockNavigate).toHaveBeenCalledWith(expectedPath)
    })
  })

  // ── Console.log ──────────────────────────────────────────────────────────────

  describe('console.log statements', () => {
    it('logs the selected level and "Begin Journey Clicked" on button click', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      // Select a level
      await user.click(screen.getByRole('button', { name: /intermediate/i }))
      // Click the journey button
      await user.click(
        screen.getByRole('button', { name: /begin your journey/i }),
      )

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Selected Level:',
        'intermediate',
      )
      expect(consoleLogSpy).toHaveBeenCalledWith('Begin Journey Clicked')
    })

    it('logs when no level is selected (shows null)', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /select your level/i }))

      expect(consoleLogSpy).toHaveBeenCalledWith('Selected Level:', null)
      expect(consoleLogSpy).toHaveBeenCalledWith('Begin Journey Clicked')
    })
  })

  // ── Loading state ────────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('disables the button and shows "Setting up..." while initializing', async () => {
      // Make the init promise stay unresolved so we can observe loading UI
      let resolvePromise!: () => void
      mockInitializeUserProgress.mockReturnValue(
        new Promise<void>(resolve => {
          resolvePromise = resolve
        }),
      )

      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /beginner/i }))
      await user.click(
        screen.getByRole('button', { name: /begin your journey/i }),
      )

      // Button should be disabled and show loading text
      const loadingBtn = screen.getByRole('button', { name: /setting up/i })
      expect(loadingBtn).toBeDisabled()

      // Resolve the promise
      resolvePromise()

      // Wait for the component to re-render after state update
      // The button should enable again eventually (after navigating)
    })
  })

  // ── Error handling ───────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('logs an error and re-enables the button when initialization fails', async () => {
      const testError = new Error('DB connection failed')
      mockInitializeUserProgress.mockRejectedValue(testError)

      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /beginner/i }))
      await user.click(
        screen.getByRole('button', { name: /begin your journey/i }),
      )

      // Wait for the promise to reject and state to update
      // The button should no longer be disabled after error
      const journeyBtn = await screen.findByRole('button', {
        name: /begin your journey/i,
      })
      expect(journeyBtn).not.toBeDisabled()

      // Should have called console.error with the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize:',
        testError,
      )

      // Should NOT have navigated
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  // ── Button is always clickable ───────────────────────────────────────────────

  describe('button clickability', () => {
    it('is NOT disabled even when no level is selected', () => {
      render(<Onboarding />)
      const btn = screen.getByRole('button', { name: /select your level/i })
      expect(btn).not.toBeDisabled()
    })

    it('is disabled only during loading', async () => {
      let resolvePromise!: () => void
      mockInitializeUserProgress.mockReturnValue(
        new Promise<void>(resolve => {
          resolvePromise = resolve
        }),
      )

      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /beginner/i }))
      await user.click(
        screen.getByRole('button', { name: /begin your journey/i }),
      )

      // Should be disabled while loading
      expect(screen.getByRole('button', { name: /setting up/i })).toBeDisabled()

      // Resolve so cleanup doesn't cause issues
      resolvePromise()
    })
  })
})

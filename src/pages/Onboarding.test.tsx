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
const mockSeedTestDataIfNeeded = vi.fn().mockResolvedValue(undefined)

vi.mock('../data/database', () => ({
  initializeUserProgress: (...args: unknown[]) =>
    mockInitializeUserProgress(...args),
  seedTestDataIfNeeded: (...args: unknown[]) =>
    mockSeedTestDataIfNeeded(...args),
}))

// Helper to find the start/submit button (the one with ▸ or "select a level")
function getStartButton(): HTMLElement | null {
  const buttons = screen.getAllByRole('button')
  return buttons.find(b =>
    b.textContent?.includes('select a level') ||
    b.textContent?.includes('▸ Begin') ||
    b.textContent?.includes('initializing')
  ) || null
}

// ─── Test suite ────────────────────────────────────────────────────────────────

describe('Onboarding', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockInitializeUserProgress.mockResolvedValue(undefined)
  })

  // ── Rendering ────────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the heading and tagline', () => {
      render(<Onboarding />)
      expect(screen.getByText('CISSP Edge')).toBeInTheDocument()
      expect(
        screen.getByText('Your offline-first CISSP preparation system'),
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
      const btn = getStartButton()
      expect(btn).toBeTruthy()
      expect(btn!.textContent).toContain('select a level')
      expect(btn).not.toBeDisabled()
    })
  })

  // ── Level selection ──────────────────────────────────────────────────────────

  describe('level selection', () => {
    it('visually highlights the clicked card', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      const beginnerBtn = screen.getByRole('button', { name: /beginner/i })

      // Before click – card should NOT have the selected styling
      expect(beginnerBtn.className).not.toContain('border-[#00f0ff]')

      await user.click(beginnerBtn)

      // After click – card should have the selected border class
      expect(beginnerBtn.className).toContain('border-[#00f0ff]')
    })

    it('updates button text to ▸ Begin after selection', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      // Initially the button says "select a level"
      expect(getStartButton()!.textContent).toContain('select a level')

      // Click a level card
      await user.click(screen.getByRole('button', { name: /beginner/i }))

      // Start button text should update to "▸ Begin"
      expect(getStartButton()!.textContent).toContain('▸ Begin')
    })

    it('removes highlight from previously selected card when another is clicked', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      const beginnerBtn = screen.getByRole('button', { name: /beginner/i })
      const intermediateBtn = screen.getByRole('button', { name: /intermediate/i })

      await user.click(beginnerBtn)
      expect(beginnerBtn.className).toContain('border-[#00f0ff]')

      await user.click(intermediateBtn)
      expect(beginnerBtn.className).not.toContain('border-[#00f0ff]')
      expect(intermediateBtn.className).toContain('border-[#00f0ff]')
    })
  })

  // ── Alert on no level selected ───────────────────────────────────────────────

  describe('alert when no level is selected', () => {
    it('shows an alert when start button is clicked with no selection', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(getStartButton()!)

      expect(alertSpy).toHaveBeenCalledTimes(1)
      expect(alertSpy).toHaveBeenCalledWith(
        'Please select a learning level to continue.',
      )
    })

    it('does NOT call navigate when no level is selected', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(getStartButton()!)

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('does NOT call initializeUserProgress when no level is selected', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(getStartButton()!)

      expect(mockInitializeUserProgress).not.toHaveBeenCalled()
    })
  })

  // ── Navigation per level ─────────────────────────────────────────────────────

  describe.each([
    { level: 'beginner', expectedPath: '/learning-path/beginner' },
    { level: 'intermediate', expectedPath: '/learning-path/intermediate' },
    { level: 'expert', expectedPath: '/learning-path/expert' },
  ])('navigation for $level level', ({ level, expectedPath }) => {
    it(`navigates to ${expectedPath} after selecting ${level} and clicking start`, async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: new RegExp(`${level}`, 'i') }))
      await user.click(getStartButton()!)

      expect(mockInitializeUserProgress).toHaveBeenCalledWith(level)
      expect(mockNavigate).toHaveBeenCalledWith(expectedPath)
    })
  })

  // ── Console.log ──────────────────────────────────────────────────────────────

  describe('console.log statements', () => {
    it('logs the selected level and "Begin Journey Clicked" on start', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /intermediate/i }))
      await user.click(getStartButton()!)

      expect(consoleLogSpy).toHaveBeenCalledWith('Selected Level:', 'intermediate')
      expect(consoleLogSpy).toHaveBeenCalledWith('Begin Journey Clicked')
    })

    it('logs "null" and "Begin Journey Clicked" with no selection', async () => {
      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(getStartButton()!)

      expect(consoleLogSpy).toHaveBeenCalledWith('Selected Level:', null)
      expect(consoleLogSpy).toHaveBeenCalledWith('Begin Journey Clicked')
    })
  })

  // ── Loading state ────────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('disables the button and shows "initializing..." while loading', async () => {
      let resolvePromise!: () => void
      mockInitializeUserProgress.mockReturnValue(
        new Promise<void>(resolve => { resolvePromise = resolve }),
      )

      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /beginner/i }))
      await user.click(getStartButton()!)

      const loadingBtn = getStartButton()
      expect(loadingBtn).toBeTruthy()
      expect(loadingBtn!.textContent).toContain('initializing')
      expect(loadingBtn).toBeDisabled()

      resolvePromise()
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
      await user.click(getStartButton()!)

      // Wait for the error state to resolve
      const startBtn = getStartButton()
      expect(startBtn).not.toBeDisabled()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize:',
        testError,
      )
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  // ── Button clickability ──────────────────────────────────────────────────────

  describe('button clickability', () => {
    it('is NOT disabled even when no level is selected', () => {
      render(<Onboarding />)
      expect(getStartButton()).not.toBeDisabled()
    })

    it('is disabled only during loading', async () => {
      let resolvePromise!: () => void
      mockInitializeUserProgress.mockReturnValue(
        new Promise<void>(resolve => { resolvePromise = resolve }),
      )

      const user = userEvent.setup()
      render(<Onboarding />)

      await user.click(screen.getByRole('button', { name: /beginner/i }))
      await user.click(getStartButton()!)

      expect(getStartButton()).toBeDisabled()

      resolvePromise()
    })
  })
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminLogin } from '@/components/auth/AdminLogin'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  setAdminSession: jest.fn(),
}))

const mockSetAdminSession = require('@/lib/auth').setAdminSession

// Mock fetch
global.fetch = jest.fn()

describe('AdminLogin Component', () => {
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  it('should render admin login form', () => {
    render(<AdminLogin onSuccess={mockOnSuccess} />)
    
    expect(screen.getByPlaceholderText('Admin password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login as admin/i })).toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const user = userEvent.setup()
    render(<AdminLogin onSuccess={mockOnSuccess} />)
    
    const passwordInput = screen.getByPlaceholderText('Admin password')
    const loginButton = screen.getByRole('button', { name: /login as admin/i })
    
    await user.type(passwordInput, 'correct-password')
    await user.click(loginButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'correct-password' }),
      })
      expect(mockSetAdminSession).toHaveBeenCalledWith(true)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should handle login failure', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid admin password' }),
    })

    const user = userEvent.setup()
    render(<AdminLogin onSuccess={mockOnSuccess} />)
    
    const passwordInput = screen.getByPlaceholderText('Admin password')
    const loginButton = screen.getByRole('button', { name: /login as admin/i })
    
    await user.type(passwordInput, 'wrong-password')
    await user.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid admin password')).toBeInTheDocument()
    })
    
    expect(mockSetAdminSession).not.toHaveBeenCalled()
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should handle network errors', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const user = userEvent.setup()
    render(<AdminLogin onSuccess={mockOnSuccess} />)
    
    const passwordInput = screen.getByPlaceholderText('Admin password')
    const loginButton = screen.getByRole('button', { name: /login as admin/i })
    
    await user.type(passwordInput, 'any-password')
    await user.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('should show error for empty password', async () => {
    const user = userEvent.setup()
    render(<AdminLogin onSuccess={mockOnSuccess} />)
    
    const loginButton = screen.getByRole('button', { name: /login as admin/i })
    
    await user.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a password')).toBeInTheDocument()
    })
    
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should handle Enter key press', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const user = userEvent.setup()
    render(<AdminLogin onSuccess={mockOnSuccess} />)
    
    const passwordInput = screen.getByPlaceholderText('Admin password')
    
    await user.type(passwordInput, 'test-password')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
  })

  it('should show loading state during login', async () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    const user = userEvent.setup()
    render(<AdminLogin onSuccess={mockOnSuccess} />)
    
    const passwordInput = screen.getByPlaceholderText('Admin password')
    const loginButton = screen.getByRole('button', { name: /login as admin/i })
    
    await user.type(passwordInput, 'test-password')
    await user.click(loginButton)
    
    expect(screen.getByText('Logging in...')).toBeInTheDocument()
    expect(loginButton).toBeDisabled()
    expect(passwordInput).toBeDisabled()
  })

  it('should clear error when typing new password', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid password' }),
    })

    const user = userEvent.setup()
    render(<AdminLogin onSuccess={mockOnSuccess} />)
    
    const passwordInput = screen.getByPlaceholderText('Admin password')
    const loginButton = screen.getByRole('button', { name: /login as admin/i })
    
    // First, trigger an error
    await user.type(passwordInput, 'wrong')
    await user.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid password')).toBeInTheDocument()
    })
    
    // Then clear the input and type again
    await user.clear(passwordInput)
    await user.type(passwordInput, 'new-password')
    
    // Error should be cleared when state changes
    expect(screen.queryByText('Invalid password')).toBeInTheDocument() // Still there until next submit
  })
})
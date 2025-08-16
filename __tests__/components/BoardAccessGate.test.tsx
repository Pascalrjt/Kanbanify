import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoardAccessGate } from '@/components/auth/BoardAccessGate'

// Mock the boardAccess module
jest.mock('@/lib/boardAccess', () => ({
  getBoardAccess: jest.fn(),
  validateBoardAccess: jest.fn(),
  addBoardAccess: jest.fn(),
}))

const mockGetBoardAccess = require('@/lib/boardAccess').getBoardAccess
const mockValidateBoardAccess = require('@/lib/boardAccess').validateBoardAccess
const mockAddBoardAccess = require('@/lib/boardAccess').addBoardAccess

describe('BoardAccessGate Component', () => {
  const mockBoardId = 'board-123'
  const mockChildren = <div>Protected Content</div>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children when user has access', async () => {
    mockGetBoardAccess.mockReturnValue([mockBoardId])
    
    render(
      <BoardAccessGate boardId={mockBoardId}>
        {mockChildren}
      </BoardAccessGate>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('should show access form when user does not have access', async () => {
    mockGetBoardAccess.mockReturnValue([])
    
    render(
      <BoardAccessGate boardId={mockBoardId}>
        {mockChildren}
      </BoardAccessGate>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Board Access Required')).toBeInTheDocument()
      expect(screen.getByText('Enter the access code for this board')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /access board/i })).toBeInTheDocument()
    })
  })

  it('should grant access with valid access code', async () => {
    mockGetBoardAccess.mockReturnValue([])
    mockValidateBoardAccess.mockResolvedValue(true)
    
    const user = userEvent.setup()
    render(
      <BoardAccessGate boardId={mockBoardId}>
        {mockChildren}
      </BoardAccessGate>
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument()
    })
    
    const accessCodeInput = screen.getByPlaceholderText('Enter access code')
    const accessButton = screen.getByRole('button', { name: /access board/i })
    
    await user.type(accessCodeInput, 'valid-code')
    await user.click(accessButton)
    
    await waitFor(() => {
      expect(mockValidateBoardAccess).toHaveBeenCalledWith(mockBoardId, 'valid-code')
      expect(mockAddBoardAccess).toHaveBeenCalledWith(mockBoardId)
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('should show error for invalid access code', async () => {
    mockGetBoardAccess.mockReturnValue([])
    mockValidateBoardAccess.mockResolvedValue(false)
    
    const user = userEvent.setup()
    render(
      <BoardAccessGate boardId={mockBoardId}>
        {mockChildren}
      </BoardAccessGate>
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument()
    })
    
    const accessCodeInput = screen.getByPlaceholderText('Enter access code')
    const accessButton = screen.getByRole('button', { name: /access board/i })
    
    await user.type(accessCodeInput, 'invalid-code')
    await user.click(accessButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid access code')).toBeInTheDocument()
    })
    
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should show error when access code is empty', async () => {
    mockGetBoardAccess.mockReturnValue([])
    
    const user = userEvent.setup()
    render(
      <BoardAccessGate boardId={mockBoardId}>
        {mockChildren}
      </BoardAccessGate>
    )
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /access board/i })).toBeInTheDocument()
    })
    
    const accessButton = screen.getByRole('button', { name: /access board/i })
    
    await user.click(accessButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter an access code')).toBeInTheDocument()
    })
    
    expect(mockValidateBoardAccess).not.toHaveBeenCalled()
  })

  it('should handle network errors during validation', async () => {
    mockGetBoardAccess.mockReturnValue([])
    mockValidateBoardAccess.mockRejectedValue(new Error('Network error'))
    
    const user = userEvent.setup()
    render(
      <BoardAccessGate boardId={mockBoardId}>
        {mockChildren}
      </BoardAccessGate>
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument()
    })
    
    const accessCodeInput = screen.getByPlaceholderText('Enter access code')
    const accessButton = screen.getByRole('button', { name: /access board/i })
    
    await user.type(accessCodeInput, 'any-code')
    await user.click(accessButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to validate access code')).toBeInTheDocument()
    })
  })

  it('should handle Enter key press in access code input', async () => {
    mockGetBoardAccess.mockReturnValue([])
    mockValidateBoardAccess.mockResolvedValue(true)
    
    const user = userEvent.setup()
    render(
      <BoardAccessGate boardId={mockBoardId}>
        {mockChildren}
      </BoardAccessGate>
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument()
    })
    
    const accessCodeInput = screen.getByPlaceholderText('Enter access code')
    
    await user.type(accessCodeInput, 'valid-code')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockValidateBoardAccess).toHaveBeenCalledWith(mockBoardId, 'valid-code')
    })
  })

  it('should show loading state during validation', async () => {
    mockGetBoardAccess.mockReturnValue([])
    mockValidateBoardAccess.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    const user = userEvent.setup()
    render(
      <BoardAccessGate boardId={mockBoardId}>
        {mockChildren}
      </BoardAccessGate>
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument()
    })
    
    const accessCodeInput = screen.getByPlaceholderText('Enter access code')
    const accessButton = screen.getByRole('button', { name: /access board/i })
    
    await user.type(accessCodeInput, 'test-code')
    await user.click(accessButton)
    
    expect(screen.getByText('Checking access...')).toBeInTheDocument()
  })
})
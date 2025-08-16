import { 
  validateBoardAccess, 
  getBoardAccess, 
  addBoardAccess, 
  removeBoardAccess, 
  clearAllBoardAccess 
} from '@/lib/boardAccess'

// Mock fetch
global.fetch = jest.fn()

describe('boardAccess utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateBoardAccess', () => {
    it('should return true for valid access code', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const result = await validateBoardAccess('board-123', 'valid-code')
      
      expect(fetch).toHaveBeenCalledWith('/api/boards/board-123/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: 'valid-code' })
      })
      expect(result).toBe(true)
    })

    it('should return false for invalid access code', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid access code' })
      })

      const result = await validateBoardAccess('board-123', 'invalid-code')
      expect(result).toBe(false)
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(validateBoardAccess('board-123', 'code')).rejects.toThrow('Network error')
    })
  })

  describe('getBoardAccess', () => {
    it('should return empty array in test environment', () => {
      // In test environment, localStorage functions are wrapped in typeof window !== 'undefined'
      // so they return empty array by default
      expect(getBoardAccess()).toEqual([])
    })
  })

  describe('addBoardAccess', () => {
    it('should not throw when called', () => {
      // Function should execute without throwing, even if localStorage is not available
      expect(() => addBoardAccess('board-1')).not.toThrow()
    })
  })

  describe('removeBoardAccess', () => {
    it('should not throw when called', () => {
      // Function should execute without throwing, even if localStorage is not available
      expect(() => removeBoardAccess('board-1')).not.toThrow()
    })
  })

  describe('clearAllBoardAccess', () => {
    it('should not throw when called', () => {
      // Function should execute without throwing, even if localStorage is not available
      expect(() => clearAllBoardAccess()).not.toThrow()
    })
  })
})
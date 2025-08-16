import { checkAdminPassword, isAdminSession, setAdminSession, logoutAdmin } from '@/lib/auth'

// Mock process.env
const mockEnv = {
  ADMIN_PASSWORD: 'admin123'
}

jest.mock('process', () => ({
  env: mockEnv
}))

describe('auth utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('checkAdminPassword', () => {
    it('should return true for correct password', () => {
      expect(checkAdminPassword('admin123')).toBe(true)
    })

    it('should return false for incorrect password', () => {
      expect(checkAdminPassword('wrong-password')).toBe(false)
    })

    it('should return false for empty password', () => {
      expect(checkAdminPassword('')).toBe(false)
    })

    it('should return false when no admin password is set', () => {
      // Temporarily override the mock
      const originalPassword = mockEnv.ADMIN_PASSWORD
      mockEnv.ADMIN_PASSWORD = undefined as any
      
      expect(checkAdminPassword('any-password')).toBe(false)
      
      // Restore the mock
      mockEnv.ADMIN_PASSWORD = originalPassword
    })
  })

  describe('isAdminSession', () => {
    it('should return false in test environment', () => {
      // In test environment, localStorage functions are wrapped in typeof window !== 'undefined'
      // so they return false by default
      expect(isAdminSession()).toBe(false)
    })
  })

  describe('setAdminSession', () => {
    it('should not throw when called', () => {
      // Functions should execute without throwing, even if localStorage is not available
      expect(() => setAdminSession(true)).not.toThrow()
      expect(() => setAdminSession(false)).not.toThrow()
    })
  })

  describe('logoutAdmin', () => {
    it('should not throw when called', () => {
      // Function should execute without throwing, even if localStorage is not available
      expect(() => logoutAdmin()).not.toThrow()
    })
  })
})
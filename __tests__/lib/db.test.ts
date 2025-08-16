import { handleDatabaseError } from '@/lib/db'

describe('database utilities', () => {
  describe('handleDatabaseError', () => {
    it('should handle unique constraint errors', () => {
      const error = new Error('unique constraint failed')
      const result = handleDatabaseError(error)
      
      expect(result).toBe('A record with this information already exists')
    })

    it('should handle foreign key constraint errors', () => {
      const error = new Error('foreign key constraint failed')
      const result = handleDatabaseError(error)
      
      expect(result).toBe('Cannot delete this item because it is referenced by other items')
    })

    it('should handle not found errors', () => {
      const error = new Error('record not found')
      const result = handleDatabaseError(error)
      
      expect(result).toBe('The requested item was not found')
    })

    it('should handle generic errors', () => {
      const error = new Error('some database error')
      const result = handleDatabaseError(error)
      
      expect(result).toBe('A database error occurred')
    })

    it('should handle non-Error objects', () => {
      const error = 'string error'
      const result = handleDatabaseError(error)
      
      expect(result).toBe('An unknown error occurred')
    })

    it('should handle null/undefined errors', () => {
      expect(handleDatabaseError(null)).toBe('An unknown error occurred')
      expect(handleDatabaseError(undefined)).toBe('An unknown error occurred')
    })

    it('should log errors in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('test error')
      
      handleDatabaseError(error)
      
      expect(consoleSpy).toHaveBeenCalledWith('Database error:', error)
      
      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should not log errors in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('test error')
      
      handleDatabaseError(error)
      
      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })
  })
})
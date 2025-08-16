export async function validateBoardAccess(boardId: string, accessCode: string): Promise<boolean> {
  const response = await fetch(`/api/boards/${boardId}/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode })
  })
  return response.ok
}

export function getBoardAccess(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const access = localStorage.getItem('board-access')
    return access ? JSON.parse(access) : []
  } catch (error) {
    console.error('Error reading board access from localStorage:', error)
    // Clear corrupted data
    localStorage.removeItem('board-access')
    return []
  }
}

export function addBoardAccess(boardId: string): void {
  try {
    const current = getBoardAccess()
    const updated = [...new Set([...current, boardId])]
    localStorage.setItem('board-access', JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving board access to localStorage:', error)
  }
}

export function removeBoardAccess(boardId: string): void {
  try {
    const current = getBoardAccess()
    const updated = current.filter(id => id !== boardId)
    localStorage.setItem('board-access', JSON.stringify(updated))
  } catch (error) {
    console.error('Error removing board access from localStorage:', error)
  }
}

export function clearAllBoardAccess(): void {
  try {
    localStorage.removeItem('board-access')
  } catch (error) {
    console.error('Error clearing board access from localStorage:', error)
  }
}
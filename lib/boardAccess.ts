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
  const access = localStorage.getItem('board-access')
  return access ? JSON.parse(access) : []
}

export function addBoardAccess(boardId: string): void {
  const current = getBoardAccess()
  const updated = [...new Set([...current, boardId])]
  localStorage.setItem('board-access', JSON.stringify(updated))
}

export function removeBoardAccess(boardId: string): void {
  const current = getBoardAccess()
  const updated = current.filter(id => id !== boardId)
  localStorage.setItem('board-access', JSON.stringify(updated))
}

export function clearAllBoardAccess(): void {
  localStorage.removeItem('board-access')
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export function isAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem('admin-authenticated') === 'true'
  } catch (error) {
    console.error('Error reading admin session from localStorage:', error)
    return false
  }
}

export function setAdminSession(isAdmin: boolean): void {
  try {
    if (isAdmin) {
      localStorage.setItem('admin-authenticated', 'true')
    } else {
      localStorage.removeItem('admin-authenticated')
    }
  } catch (error) {
    console.error('Error setting admin session in localStorage:', error)
  }
}

export function logoutAdmin(): void {
  try {
    localStorage.removeItem('admin-authenticated')
  } catch (error) {
    console.error('Error removing admin session from localStorage:', error)
  }
}
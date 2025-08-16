const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export function isAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('admin-authenticated') === 'true'
}

export function setAdminSession(isAdmin: boolean): void {
  if (isAdmin) {
    localStorage.setItem('admin-authenticated', 'true')
  } else {
    localStorage.removeItem('admin-authenticated')
  }
}

export function logoutAdmin(): void {
  localStorage.removeItem('admin-authenticated')
}
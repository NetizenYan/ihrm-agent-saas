import Cookies from 'js-cookie'

const TOKEN_KEY = 'Admin-Token-HRM'

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token)
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY)
}

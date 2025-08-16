import '@testing-library/jest-dom'

// Polyfill for Next.js API route testing
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Request and Response for API testing
global.Request = global.Request || class Request {
  constructor(input, init) {
    Object.defineProperty(this, 'url', { value: input, writable: false })
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers || {})
    this.body = init?.body
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
}

global.Response = global.Response || class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Headers(init?.headers || {})
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    })
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
}

global.Headers = global.Headers || class Headers {
  constructor(init) {
    this.headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }
  
  get(name) {
    return this.headers.get(name.toLowerCase())
  }
  
  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

import { localStorageMock } from './__mocks__/localStorage';

global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn()

// Setup MSW
beforeAll(() => {
  // Start the MSW server before all tests
})

afterEach(() => {
  // Reset all mocks after each test
  jest.clearAllMocks()
})

afterAll(() => {
  // Clean up after all tests
})
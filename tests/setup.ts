import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Inertia.js
vi.mock('@inertiajs/react', () => ({
  router: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    reload: vi.fn(),
  },
  Head: ({ children }: { children: React.ReactNode }) => children,
  Link: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
  usePage: () => ({
    props: {},
    url: '/',
    component: 'Test',
  }),
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hash: '',
    href: 'http://localhost:3000/',
    pathname: '/',
    search: '',
    assign: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
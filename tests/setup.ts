/**
 * Test Setup - Vitest
 * Global test configuration and utilities
 */

import { vi } from 'vitest';

// Mock Web Crypto API for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = await import('crypto');
  globalThis.crypto = webcrypto;
}

// Mock AudioContext
globalThis.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: () => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: 'sine',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  }),
  createGain: () => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  }),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn()
}));

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
    dispatchEvent: vi.fn()
  }))
});

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined)
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('')
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return {
      getContext: vi.fn(() => ({
        fillRect: vi.fn(),
        fillText: vi.fn(),
        font: '',
        fillStyle: ''
      })),
      width: 0,
      height: 0,
      style: {}
    };
  }
  return originalCreateElement(tagName);
});

// Test utilities
export function createMockDeviceCatalog() {
  return [
    {
      key: 'samsung',
      name: 'Samsung',
      os: 'Android',
      models: [
        { k: 's24u', n: 'Galaxy S24 Ultra', dpi: 505, hz: 120, tl: 5, pt: 2, tier: 'FS' },
        { k: 's24', n: 'Galaxy S24', dpi: 416, hz: 120, tl: 6, pt: 2, tier: 'FS' },
        { k: 'a55', n: 'Galaxy A55', dpi: 390, hz: 120, tl: 7, pt: 1, tier: 'UM' }
      ]
    },
    {
      key: 'apple',
      name: 'Apple (iPhone/iPad)',
      os: 'iOS',
      models: [
        { k: 'ip16pm', n: 'iPhone 16 Pro Max', dpi: 460, hz: 120, tl: 5, pt: 2, tier: 'FS' },
        { k: 'ip16', n: 'iPhone 16', dpi: 460, hz: 60, tl: 7, pt: 1, tier: 'FS' }
      ]
    }
  ];
}

export function createMockFormData(overrides = {}) {
  return {
    brandKey: 'samsung',
    modelKey: 's24u',
    playstyle: 'balanced',
    issueText: 'rung tâm, lag nhẹ',
    ...overrides
  };
}
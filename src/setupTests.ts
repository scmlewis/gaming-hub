// test setup for Vitest + Testing Library
import '@testing-library/jest-dom'
// Make React 18 act() environment available in tests
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// Polyfill for window.matchMedia in jsdom/vitest environment
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}),
	})
}

// test setup for Vitest + Testing Library
import '@testing-library/jest-dom'
// Make React 18 act() environment available in tests
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

import { test, expect } from 'vitest'

// Test to check that required environment variables are defined
test('environment variables are defined', () => {
	expect(process.env.URL).toBeDefined()
	expect(process.env.PORT).toBeDefined()
	expect(process.env.WEBSITE).toBeDefined()
	expect(process.env.API).toBeDefined()
	expect(process.env.LOCAL).toBeDefined()
})

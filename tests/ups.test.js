import { test, expect } from 'vitest'
import dotenv from 'dotenv'
import ups from '../src/models/Ups.js' // Import the instance directly

dotenv.config() // Load environment variables from .env file

test('parseData method correctly parses content', () => {
	const mockContent = `
		<table>
			<tr><td>2023-01-01</td><td>10%</td><td>5%</td></tr>
			<tr><td>2023-01-02</td><td>15%</td><td>10%</td></tr>
		</table>
	`
	const parsedData = ups.parseData(mockContent)

	expect(parsedData.length).toBe(2)
	expect(parsedData[0]).toEqual({
		date: '2023-01-01',
		standard: '10',
		express: '5'
	})
})

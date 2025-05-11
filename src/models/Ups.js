import puppeteer from 'puppeteer'
import { parse } from 'node-html-parser'

class Ups {
	constructor () {
		this.url = process.env.URL
		this.selector = '#link1 tbody'
		this.delay = 10000
	}

	async browse () {
		const browser = await puppeteer.launch({
			browser: 'firefox',
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'],
			ignoreDefaultArgs: ['--disable-extensions'],
			waitForInitialPage: false
		})

		const [page] = await browser.pages()
		await page.goto(this.url, { waitUntil: 'networkidle2', timeout: this.delay })

		const content = await page.$eval(this.selector, table => table.innerHTML)
		const data = this.parseData(content)

		await browser.close()
		return data
	}

	parseData (content) {
		const table = parse(content)
		const rows = Array.from(table.querySelectorAll('tr'))

		return rows.slice(0, 2).map(row => {
			const cells = row.querySelectorAll('td')
			return {
				date: cells[0].innerText,
				standard: cells[1].innerText.replace(/\%/g, ''),
				express: cells[2].innerText.replace(/\%/g, '')
			}
		})
	}
}

export default new Ups()

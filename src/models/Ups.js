import puppeteer from 'puppeteer'
import { parse } from 'node-html-parser'

class Ups {
	constructor () {
		this.url = process.env.URL
		this.selector = '#RevenueSurchargeHistory tbody'
		this.delay = 10000
	}

	async browse () {
		const browser = await puppeteer.launch({
			headless: false,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
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

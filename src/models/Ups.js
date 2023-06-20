import puppeteer from 'puppeteer'

class Ups {
	constructor () {
		this.url = process.env.URL
		this.count = 2
	}

	async browse () {
		const browser = await puppeteer.launch({
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
			ignoreDefaultArgs: ['--disable-extensions'],
		})
		const page = await browser.newPage()
		await page.goto(this.url)
		await page.waitForSelector('#RevenueSurchargeHistory tbody', {
			timeout: 10000
		})

		const surcharge = await page.evaluate(() => {
			const data = []
			const table = document.querySelector(`#RevenueSurchargeHistory tbody`)
			const rows = Array.from(table.querySelectorAll('tr'))

			rows.slice(0, 2).forEach(row => {
				const cells = row.querySelectorAll('td')
				data.push({
					date: cells[0].innerText,
					standard: cells[1].innerText.replace(/\%/g, ''),
					express: cells[2].innerText.replace(/\%/g, '')
				})
			})
			return data
		})

		await browser.close()
		return surcharge
	}
}

export default new Ups()

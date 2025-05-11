import puppeteer, { Browser, Page } from 'puppeteer'
import { parse, HTMLElement } from 'node-html-parser'

/**
 * Interface representing UPS fuel surcharge data
 */
interface FuelSurcharge {
  /** Date of the surcharge */
  date: string
  /** Standard service surcharge percentage */
  standard: string
  /** Express service surcharge percentage */
  express: string
}

/**
 * Class for scraping UPS fuel surcharge data
 * Uses Puppeteer to browse the UPS website and extract surcharge information
 */
class Ups {
  /** URL of the UPS fuel surcharge page */
  private url: string
  /** CSS selector for the surcharge table */
  private selector: string
  /** Delay in milliseconds for page loading */
  private delay: number

  /**
   * Creates a new Ups instance
   * Initializes URL, selector and delay values
   */
  constructor () {
    this.url = process.env.URL || ''
    this.selector = '#link1 tbody'
    this.delay = 10000
  }

  /**
   * Browses the UPS website and extracts fuel surcharge data
   * @returns Promise resolving to an array of FuelSurcharge objects
   */
  async browse (): Promise<FuelSurcharge[]> {
    let browser: Browser | null = null
    try {
      browser = await puppeteer.launch({
        browser: 'firefox',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-extensions',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ],
        ignoreDefaultArgs: ['--disable-extensions'],
        waitForInitialPage: false
      })

      const [page]: Page[] = await browser.pages()

      // Set viewport to ensure consistent rendering
      await page.setViewport({ width: 1920, height: 1080 })

      // Navigate to the page with increased timeout
      await page.goto(this.url, {
        waitUntil: 'networkidle2',
        timeout: this.delay
      })

      // Wait for the selector to be present
      await page.waitForSelector(this.selector, {
        timeout: this.delay,
        visible: true
      })

      const content: string = await page.$eval(this.selector, table => table.innerHTML)
      const data: FuelSurcharge[] = this.parseData(content)

      return data
    }
		catch (error) {
      console.error('Error during scraping:', error)
      throw error
    }
		finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  /**
   * Parses HTML content to extract fuel surcharge data
   * @param content - HTML content of the surcharge table
   * @returns Array of FuelSurcharge objects
   */
  private parseData (content: string): FuelSurcharge[] {
    const table = parse(content)
    const rows: HTMLElement[] = Array.from(table.querySelectorAll('tr'))

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

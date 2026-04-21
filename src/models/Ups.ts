import puppeteer, { Browser, Page } from 'puppeteer-core'
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
 * Connects to an already running Lightpanda instance through CDP
 */
class Ups {
  /** URL of the UPS fuel surcharge page */
  private url: string
  /** CSS selector for the surcharge table */
  private selector: string
  /** Delay in milliseconds for page loading */
  private delay: number
  /** Lightpanda websocket endpoint */
  private lightpandaWsEndpoint: string

  /**
   * Creates a new Ups instance
   * Initializes URL, selector and runtime values
   */
  constructor () {
    this.url = process.env.URL || ''
    this.selector = 'table tbody'
    this.delay = Number(process.env.SCRAPER_TIMEOUT_MS) || 10000
    this.lightpandaWsEndpoint = process.env.LIGHTPANDA_WS_ENDPOINT || 'ws://127.0.0.1:9222/'
  }


  /**
   * Browses the UPS website and extracts fuel surcharge data
   * @returns Promise resolving to an array of FuelSurcharge objects
   */
  async browse (maxRetries: number = 3): Promise<FuelSurcharge[]> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let browser: Browser | null = null

      try {
        browser = await puppeteer.connect({
          browserWSEndpoint: this.lightpandaWsEndpoint,
          protocolTimeout: Number(process.env.LIGHTPANDA_PROTOCOL_TIMEOUT_MS) || 15000
        })

        const page: Page = await browser.newPage()

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
        await page.setExtraHTTPHeaders({
          'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
        })
        await page.setViewport({ width: 1920, height: 1080 })

        const response = await page.goto(this.url, {
          waitUntil: 'load',
          timeout: this.delay
        })

        if (!response || !response.ok()) {
          throw new Error(`UPS page returned invalid status: ${response?.status()}`)
        }

        await page.waitForSelector(this.selector, {
          timeout: this.delay,
          visible: true
        })

        const content: string = await page.$eval(this.selector, (table: any) => table.innerHTML)
        const data: FuelSurcharge[] = this.parseData(content)

        await browser.disconnect()
        return data
      }
      catch (error) {
        lastError = error as Error
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error)

        if (browser) {
          await browser.disconnect().catch(() => {})
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
        }
      }
    }

    throw lastError
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

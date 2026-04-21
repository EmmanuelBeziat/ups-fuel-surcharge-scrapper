import { spawn, type ChildProcess } from 'node:child_process'
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

interface LightpandaRuntime {
  proc: ChildProcess
  wsEndpoint: string
  stdout: string[]
  stderr: string[]
}

/**
 * Class for scraping UPS fuel surcharge data
 * Uses Lightpanda (ephemeral process) + Puppeteer CDP connection
 */
class Ups {
  /** URL of the UPS fuel surcharge page */
  private url: string
  /** CSS selector for the surcharge table */
  private selector: string
  /** Delay in milliseconds for page loading */
  private delay: number
  /** Lightpanda binary path */
  private lightpandaBin: string
  /** Lightpanda host */
  private lightpandaHost: string
  /** Lightpanda port */
  private lightpandaPort: number

  /**
   * Creates a new Ups instance
   * Initializes URL, selector and runtime values
   */
  constructor () {
    this.url = process.env.URL || ''
    this.selector = 'table tbody'
    this.delay = Number(process.env.SCRAPER_TIMEOUT_MS) || 10000
    this.lightpandaBin = process.env.LIGHTPANDA_BIN || 'lightpanda'
    this.lightpandaHost = process.env.LIGHTPANDA_HOST || '127.0.0.1'
    this.lightpandaPort = Number(process.env.LIGHTPANDA_PORT) || 9222
  }

  /**
   * Starts an ephemeral Lightpanda process and returns runtime info
   */
  private async startLightpanda (): Promise<LightpandaRuntime> {
    const startupTimeout = Number(process.env.LIGHTPANDA_STARTUP_TIMEOUT_MS) || 8000
    const proc = spawn(this.lightpandaBin, ['serve', '--host', this.lightpandaHost, '--port', String(this.lightpandaPort)], {
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const wsEndpoint = process.env.LIGHTPANDA_WS_ENDPOINT || `ws://${this.lightpandaHost}:${this.lightpandaPort}/`
    const stdout: string[] = []
    const stderr: string[] = []

    proc.stdout?.on('data', (chunk: Buffer) => {
      const line = chunk.toString()
      stdout.push(line)
      if (process.env.DEBUG_LIGHTPANDA === '1') {
        console.log(`[lightpanda:stdout] ${line.trim()}`)
      }
    })

    proc.stderr?.on('data', (chunk: Buffer) => {
      const line = chunk.toString()
      stderr.push(line)
      if (process.env.DEBUG_LIGHTPANDA === '1') {
        console.error(`[lightpanda:stderr] ${line.trim()}`)
      }
    })

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup()
        resolve()
      }, startupTimeout)

      const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
        cleanup()
        const details = this.formatLightpandaLogs(stdout, stderr)
        reject(new Error(`Lightpanda exited before startup (code: ${code}, signal: ${signal}). ${details}`))
      }

      const onError = (err: Error) => {
        cleanup()
        reject(err)
      }

      const cleanup = (): void => {
        clearTimeout(timer)
        proc.off('exit', onExit)
        proc.off('error', onError)
      }

      proc.once('exit', onExit)
      proc.once('error', onError)
    })

    return { proc, wsEndpoint, stdout, stderr }
  }

  /**
   * Returns compact startup logs for troubleshooting
   */
  private formatLightpandaLogs (stdout: string[], stderr: string[]): string {
    const out = stdout.join('').trim().slice(-500)
    const err = stderr.join('').trim().slice(-500)
    return `stdout="${out || '<empty>'}" stderr="${err || '<empty>'}"`
  }

  /**
   * Stops the Lightpanda process
   */
  private async stopLightpanda (proc?: ChildProcess): Promise<void> {
    if (!proc || proc.killed) return

    proc.kill('SIGTERM')
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!proc.killed) {
      proc.kill('SIGKILL')
    }
  }

  /**
   * Browses the UPS website and extracts fuel surcharge data
   * @returns Promise resolving to an array of FuelSurcharge objects
   */
  async browse (maxRetries: number = 3): Promise<FuelSurcharge[]> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let runtime: LightpandaRuntime | null = null
      let browser: Browser | null = null

      try {
        runtime = await this.startLightpanda()
        browser = await puppeteer.connect({
          browserWSEndpoint: runtime.wsEndpoint,
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

        await browser.close()
        await this.stopLightpanda(runtime.proc)

        return data
      }
      catch (error) {
        lastError = error as Error
        const logs = runtime ? this.formatLightpandaLogs(runtime.stdout, runtime.stderr) : 'no process logs captured'
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error)
        console.error(`[lightpanda:debug] ${logs}`)

        if (browser) {
          await browser.close().catch(() => {})
        }

        if (runtime) {
          await this.stopLightpanda(runtime.proc)
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

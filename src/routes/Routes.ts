import type { FastifyInstance } from 'fastify'
import { UpsController } from '../controllers/index.ts'

/**
 * Router class for handling API routes
 */
export class Router {
  /** Base URL for API endpoints */
  private apiURL: string
  /** Instance of UpsController for handling UPS related routes */
  private ups: UpsController

  /**
   * Creates a new Router instance
   * Initializes API URL and controller instances
   */
  constructor () {
    this.apiURL = process.env.API || '/api/ups/'
    this.ups = new UpsController()
  }

  /**
   * Sets up all API routes
   * @param app - Fastify application instance
   */
  routes (app: FastifyInstance): void {
    app.get(this.apiURL, (req, reply) => {
      return this.ups.index(req, reply)
    })
  }
}

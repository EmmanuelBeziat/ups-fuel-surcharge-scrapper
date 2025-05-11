import fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { Router } from './routes/Routes.ts'

/**
 * Main application class
 * Initializes Fastify instance and sets up routes
 */
class App {
  /** Fastify application instance */
  public app: FastifyInstance
  /** Router instance for handling routes */
  private router: Router

  /**
   * Creates a new App instance
   * Initializes Fastify and sets up routing
   */
  constructor () {
    this.app = fastify()
    this.router = new Router()
    this.router.routes(this.app)
  }
}

export default new App().app

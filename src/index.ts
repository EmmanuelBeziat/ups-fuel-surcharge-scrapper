/**
 * Main application entry point
 * Sets up CORS, favicons and starts the server
 */
import App from './App.ts'
import cors from '@fastify/cors'
import favicons from 'fastify-favicon'
import type { FastifyInstance } from 'fastify'

/**
 * Configure CORS middleware
 * Allows requests from any origin
 */
App.register(cors, (_instance: FastifyInstance) => {
  return (req: any, callback: (err: Error | null, options?: any) => void) => {
    const origin = req.headers.origin
    const corsOptions = {
      origin: (!origin)
    }
    callback(null, corsOptions)
  }
})

/**
 * Configure favicon middleware
 * Serves favicons from the public directory
 */
App.register(favicons, {
  path: './public/favicons',
  name: 'favicon.ico'
})

/**
 * Start the server
 * Uses PORT from environment variables or defaults to 3000
 * Uses LOCAL from environment variables or defaults to 127.0.0.1
 */
App.listen({ port: Number(process.env.PORT) || 3000, host: process.env.LOCAL || '127.0.0.1' })
  .then(address => {
    console.log(`Server started on ${address}`)
  })
  .catch(error => {
    console.log(`Error starting server: ${error}`)
    process.exit(1)
  })

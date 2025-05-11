import type { FastifyRequest, FastifyReply } from 'fastify'
import Ups from '../models/Ups.ts'

/**
 * Controller for handling UPS fuel surcharge related requests
 */
export class UpsController {
  /**
   * Handles GET request for fuel surcharge data
   * @param _req - Fastify request object
   * @param reply - Fastify reply object
   */
  index (_req: FastifyRequest, reply: FastifyReply): void {
    Ups.browse()
      .then(data => reply.send(data))
      .catch(err => reply.code(404).send(err))
  }
}

import Ups from '../models/Ups.js'

export class UpsController {
	index (req, reply) {
		Ups.browse()
			.then(data => reply.send(data))
			.catch(err => reply.code(404).send(err))
	}
}

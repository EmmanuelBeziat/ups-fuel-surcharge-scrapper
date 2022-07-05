import { UpsController } from '../controllers/index.js'

export class Router {
	constructor () {
		this.apiURL = process.env.API || '/api/ups/'
		this.ups = new UpsController()
	}

	routes (app) {
		app.get(this.apiURL, (req, reply) => {
			return this.ups.index(req, reply)
		})
	}
}

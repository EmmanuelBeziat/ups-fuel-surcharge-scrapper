import App from './App.js'
import CORS from '@fastify/cors'
import favicons from 'fastify-favicon'

/* App.register(CORS, {
	origin: (origin, cb) => {
		if (/localhost/.test(origin) || 'https://hittheroad.co') {
			cb(null, true)
			true
		}

		cb(new Error('Not allowed'))
	}
}) */

/* App.register(favicons, {
	path: './public/favicons'
}) */

App.listen(process.env.port || 3000, (err, address) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}

	console.log(`Server listening on ${address}`)
})

import App from './App.js'
import CORS from '@fastify/cors'
// import favicons from 'fastify-favicon'

App.register(CORS, instance => {
	return (req, callback) => {
		const origin = req.headers.origin
		// const hostname = new URL(origin).hostname
		const corsOptions = {
			origin: (!origin)
		}
		callback(null, corsOptions)
	}
})

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

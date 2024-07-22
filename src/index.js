import App from './App.js'
import cors from '@fastify/cors'
import favicons from 'fastify-favicon'

App.register(cors, instance => {
	return (req, callback) => {
		const origin = req.headers.origin
		// const hostname = new URL(origin).hostname
		const corsOptions = {
			origin: (!origin)
		}
		callback(null, corsOptions)
	}
})

App.register(favicons, {
	path: './public/favicons',
	name: 'favicon.ico'
})

// Server start
App.listen({ port: process.env.PORT || 3000, host: process.env.LOCAL || '127.0.0.1' })
	.then(address => {
		console.log(`Server started on ${address}`)
	})
	.catch(error => {
		console.log(`Error starting server: ${error}`)
		process.exit(1)
	})

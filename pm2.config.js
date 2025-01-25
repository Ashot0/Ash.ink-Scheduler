export default {
	apps: [
		{
			name: 'pinterest-bot', // Process name
			script: './app.js', // Entry point
			watch: true, // Restart on file changes
			instances: 1, // Single instance
			autorestart: true, // Auto-restart on crash
			max_memory_restart: '480M', // Restart if memory exceeds 480 MB
			env: {
				NODE_ENV: 'production', // Environment variable
				PORT: process.env.PORT || 3000, // Use environment port
			},
		},
	],
};

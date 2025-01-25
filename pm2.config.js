module.exports = {
	apps: [
		{
			name: 'pinterest-bot',
			script: './app.js',
			watch: true,
			instances: 1,
			autorestart: true,
			max_memory_restart: '480M',
			env: {
				NODE_ENV: 'production',
				PORT: process.env.PORT || 3000,
			},
		},
	],
};

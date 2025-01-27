const express = require('express');
const { port } = require('../config');

const app = express();

// Лог запросов
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
	next();
});

// Корневой маршрут
app.get('/', (req, res) => {
	res.send('Приложение работает! 🚀');
});

// Запуск сервера
const startServer = () => {
	app.listen(port, () => {
		console.log(`Сервер запущен на порту ${port}`);
	});
};

module.exports = startServer;

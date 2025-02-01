const express = require('express');
const fs = require('fs').promises; // Используем асинхронные операции с файлами
const path = require('path');
const config = require('../config.js');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(compression()); // Сжатие ответов для экономии трафика
app.use(helmet()); // Улучшенная безопасность
app.use(morgan('tiny')); // Логирование запросов

// Путь к файлу конфигурации
const configPath = path.resolve(__dirname, '../config.js');

// Функция для асинхронного обновления `authCode`
const updateAuthCodeInConfig = async (authCode) => {
	try {
		let configContent = await fs.readFile(configPath, 'utf-8');
		configContent = configContent.replace(
			/authCode: ['"`]?[^'"`,]+['"`]?,/,
			`authCode: '${authCode}',`
		);
		await fs.writeFile(configPath, configContent, 'utf-8');
		console.log('✅ authCode успешно обновлён в config.js');
	} catch (error) {
		console.error('❌ Ошибка при обновлении config.js:', error.message);
	}
};

// Корневой маршрут
app.get('/', async (req, res) => {
	const code = req.query.code;

	if (code) {
		console.log(`🔑 Код авторизации: ${code}`);
		await updateAuthCodeInConfig(code); // Обновляем конфиг асинхронно
		return res.send(`Код авторизации успешно сохранён: ${code}`);
	}

	res.send('Приложение работает! 🚀');
});

// Запуск сервера
const startServer = () => {
	app.listen(config.port, () => {
		console.log(`🚀 Сервер запущен на порту ${config.port}`);
	});
};

module.exports = startServer;

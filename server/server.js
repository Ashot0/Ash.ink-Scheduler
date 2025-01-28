const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config.js');

const app = express();

// Путь к файлу конфигурации
const configPath = path.resolve(__dirname, '../config.js');

// Функция для обновления `authCode` в файле `config.js`
const updateAuthCodeInConfig = (authCode) => {
	try {
		// Читаем содержимое config.js
		let configContent = fs.readFileSync(configPath, 'utf-8');
		console.log(configContent, '11111111111111');
		// Обновляем поле `authCode`
		configContent = configContent.replace(
			/authCode: ['"`]?[^'"`,]+['"`]?,/,
			`authCode: '${authCode}',`
		);
		console.log(configContent, '2222222222222222222');
		// Записываем изменения обратно в файл
		fs.writeFileSync(configPath, configContent, 'utf-8');
		console.log(configContent, '333333333333333333');
		console.log('✅ authCode успешно обновлён в config.js');
		console.log(config);
		console.log(configPath, 'ПУТЬ4444444444444444444444444');
	} catch (error) {
		console.error('❌ Ошибка при обновлении config.js:', error.message);
	}
};

// Лог запросов
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
	next();
});

// Корневой маршрут
app.get('/', (req, res) => {
	// Извлекаем параметр `code` из строки запроса
	const code = req.query.code;

	if (code) {
		console.log(`Код авторизации: ${code}`);
		updateAuthCodeInConfig(code); // Обновляем конфиг
		res.send(`Код авторизации успешно сохранён: ${code}`);
	} else {
		res.status(400).send('Параметр code не найден в запросе.');
	}
});

// Запуск сервера
const startServer = () => {
	app.listen(config.port, () => {
		console.log(`Сервер запущен на порту ${config.port}`);
	});
};

module.exports = startServer;

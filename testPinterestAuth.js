const axios = require('axios');
const fs = require('fs');
const path = require('path');

const configEnv = require('./config.js');

// Путь к файлу конфигурации
const configPath = path.resolve(__dirname, './config.js');

// Ваши данные
const config = {
	client_id: configEnv.pinterest.clientId, // Ваш client_id (Идентификатор приложения)
	client_secret: configEnv.pinterest.clientSecret, // Ваш client_secret (Секретный ключ приложения)
	code: configEnv.pinterest.authCode, // Ваш код авторизации
	redirect_uri: configEnv.pinterest.redirectUri, // Ваш redirect_uri
};

// Функция для генерации base64 закодированного заголовка Authorization
const generateAuthHeader = (client_id, client_secret) => {
	const base64String = Buffer.from(`${client_id}:${client_secret}`).toString(
		'base64'
	);
	return `Basic ${base64String}`;
};

// Функция для обновления токенов в config.js
const updateConfigFile = (accessToken, refreshToken) => {
	try {
		// Читаем содержимое config.js
		let configContent = fs.readFileSync(configPath, 'utf-8');

		// Обновляем токены (учитываем, что они могут быть числами или строками)
		configContent = configContent.replace(
			/token:\s*(\d+|'.*?'|".*?"),?/,
			`token: '${accessToken}',`
		);
		configContent = configContent.replace(
			/refreshToken:\s*(\d+|'.*?'|".*?"),?/,
			`refreshToken: '${refreshToken}',`
		);

		// Записываем изменения обратно в файл
		fs.writeFileSync(configPath, configContent, 'utf-8');
		console.log('✅ Токены успешно записаны в config.js');
	} catch (error) {
		console.error('❌ Ошибка при обновлении config.js:', error.message);
	}
};

// Асинхронная функция для получения токена
const getAccessToken = async () => {
	try {
		// Генерация заголовка Authorization
		const authHeader = generateAuthHeader(
			config.client_id,
			config.client_secret
		);

		// Отправка запроса на получение токена
		const response = await axios.post(
			'https://api.pinterest.com/v5/oauth/token',
			new URLSearchParams({
				grant_type: 'authorization_code',
				code: config.code,
				redirect_uri: config.redirect_uri,
			}).toString(),
			{
				headers: {
					Authorization: authHeader,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);

		console.log('✅ Токен успешно получен!');
		console.log('Ответ от Pinterest API:', response.data);

		// Извлекаем токены из ответа
		const { access_token, refresh_token } = response.data;

		// Обновляем config.js
		updateConfigFile(access_token, refresh_token);
	} catch (error) {
		if (error.response) {
			console.error('❌ Ошибка от Pinterest API:');
			console.error('Код ошибки:', error.response.status);
			console.error('Данные ошибки:', error.response.data);
		} else {
			console.error('❌ Ошибка выполнения запроса:', error.message);
		}
	}
};

module.exports = getAccessToken;
// getAccessToken();

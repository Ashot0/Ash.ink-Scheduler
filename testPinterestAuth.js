const axios = require('axios');
const fs = require('fs');

const configEnv = require('./config.js');

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

		// Сохраняем токен в файл (если нужно)
		fs.writeFileSync(
			'access_token.json',
			JSON.stringify(response.data, null, 2)
		);
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

// Запуск функции
getAccessToken();

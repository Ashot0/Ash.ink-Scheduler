const axios = require('axios');
const fs = require('fs');
const path = require('path');
const configPath = path.resolve(__dirname, '../config.js'); // Путь к config.js
let config = require(configPath); // Подгружаем текущий конфиг
const getAccessToken = require('../testPinterestAuth');

async function refreshPinterestToken() {
	const { refreshToken, clientId, clientSecret } = config.pinterest;

	// Генерация Base64 для заголовка Authorization
	const base64Auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
		'base64'
	);

	try {
		console.log('🔄 Обновление Pinterest токена...');

		// Запрос на обновление токена
		const response = await axios.post(
			'https://api.pinterest.com/v5/oauth/token',
			new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
			}).toString(),
			{
				headers: {
					Authorization: `Basic ${base64Auth}`,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);

		const newAccessToken = response.data.access_token;
		console.log('✅ Новый токен Pinterest получен:', newAccessToken);

		// Обновляем токен в конфиге
		config.pinterest.token = newAccessToken;
		const configString = `module.exports = ${JSON.stringify(config, null, 2)};`;
		fs.writeFileSync(configPath, configString, 'utf-8');
		console.log('✅ Токен обновлён и записан в config.js.');

		return true;
	} catch (error) {
		console.error(
			'❌ Ошибка при обновлении токена:',
			error.response?.data || error.message
		);
		getAccessToken();
		return true;
	}
}

async function testPinterestToken() {
	const url = 'https://api.pinterest.com/v5/user_account'; // Верификация токена

	try {
		console.log('Верификация Pinterest токена...');

		// Проверяем текущий токен
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${config.pinterest.token}`,
			},
		});
		console.log('✅ Успешная аутентификация, Ваш user_id:', response.data.id);

		return true;
	} catch (error) {
		// Если токен истёк (401 Unauthorized), обновляем его
		if (error.response?.status === 401) {
			console.error('⚠️ Токен истёк, выполняется обновление...');
			return await refreshPinterestToken();
		}

		// Обработка других ошибок
		console.error(
			'❌ Ошибка верификации токена:',
			error.response?.data || error.message
		);
		return false;
	}
}

module.exports = {
	testPinterestToken,
};

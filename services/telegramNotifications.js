const axios = require('axios');
const config = require('../config'); // Подключение конфигов

const telegramToken = config.telegram.token; // Токен Telegram-бота
const chatId = config.telegram.usernamelId; // Заменить на правильный chatId

const urlToTg = `https://www.pinterest.com/oauth/?client_id=${config.pinterest.clientId}&redirect_uri=${config.pinterest.redirectUri}&response_type=code&scope=pins:read,boards:read,user_accounts:read`;

// Функция для отправки сообщения в Telegram
const sendTelegramMessage = () => {
	const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

	const params = {
		chat_id: chatId, // Используем chatId, а не username
		text: urlToTg,
	};

	axios
		.post(url, params)
		.then((response) => {
			console.log('✅ Сообщение отправлено в Telegram:', response.data);
		})
		.catch((error) => {
			console.error(
				'❌ Ошибка при отправке сообщения в Telegram:',
				error.response?.data || error.message
			);
		});
};

// Пример отправки URL в Telegram
// sendTelegramMessage();
module.exports = sendTelegramMessage;

const axios = require('axios');
const { telegramBotToken, channelId } = require('../config');

/**
 * Отправка изображения в Telegram
 */
async function sendToTelegram(imageUrl, caption = '') {
	const url = `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`;

	try {
		const response = await axios.post(url, {
			chat_id: channelId,
			photo: imageUrl,
			// Описание
			// caption,
		});
		console.log('Успешно отправлено в Telegram:', response.data);
		return true;
	} catch (error) {
		console.error(
			'Ошибка отправки в Telegram:',
			error.response?.data || error.message
		);
		return false;
	}
}

module.exports = { sendToTelegram };

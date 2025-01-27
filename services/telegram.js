const axios = require('axios');
const config = require('../config');

/**
 * Отправка изображения в Telegram
 */
async function sendToTelegram(imageUrl, caption = '') {
	const url = `https://api.telegram.org/bot${config.telegram.token}/sendPhoto`;

	try {
		const response = await axios.post(url, {
			chat_id: config.telegram.channelId,
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

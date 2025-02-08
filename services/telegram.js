const axios = require('axios');
const config = require('../config');

/**
 * Отправка изображения в Telegram-канал.
 * Если передан fileId (не URL), Telegram распознаёт его как идентификатор файла.
 * @param {string} imageId fileId или HTTP URL изображения.
 * @param {string} [caption] Подпись к фото.
 */
async function sendToTelegram(imageId, caption = '') {
	const url = `https://api.telegram.org/bot${config.telegram.token}/sendPhoto`;
	try {
		const response = await axios.post(url, {
			chat_id: config.telegram.channelId,
			photo: imageId,
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

/**
 * Получение URL файла по fileId (если нужен внешний HTTP URL).
 * Но для отправки из ЛС этот шаг можно пропустить.
 */
async function getTelegramFileUrl(fileId) {
	const url = `https://api.telegram.org/bot${config.telegram.token}/getFile`;
	try {
		const response = await axios.get(url, { params: { file_id: fileId } });
		const filePath = response.data.result.file_path;
		return `https://api.telegram.org/file/bot${config.telegram.token}/${filePath}`;
	} catch (error) {
		console.error(
			'Ошибка получения URL файла:',
			error.response?.data || error.message
		);
		return null;
	}
}

/**
 * Получение обновлений (новых сообщений) от Telegram.
 */
async function getUpdates() {
	const url = `https://api.telegram.org/bot${config.telegram.token}/getUpdates`;
	try {
		const response = await axios.get(url);
		return response.data.result || [];
	} catch (error) {
		console.error(
			'Ошибка получения обновлений от Telegram:',
			error.response?.data || error.message
		);
		return [];
	}
}

/**
 * Удаление сообщения в Telegram.
 * @param {number} chatId ID чата.
 * @param {number} messageId ID сообщения.
 */
async function deleteMessage(chatId, messageId) {
	const url = `https://api.telegram.org/bot${config.telegram.token}/deleteMessage`;
	try {
		await axios.post(url, { chat_id: chatId, message_id: messageId });
		console.log(`Сообщение ${messageId} удалено из чата ${chatId}`);
	} catch (error) {
		console.error(
			'Ошибка при удалении сообщения:',
			error.response?.data || error.message
		);
	}
}

module.exports = {
	sendToTelegram,
	getTelegramFileUrl,
	getUpdates,
	deleteMessage,
};

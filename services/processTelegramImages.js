const axios = require('axios');
const { sendToTelegram, getUpdates, deleteMessage } = require('./telegram');
const config = require('../config');

/**
 * Проверяет обновления Telegram на наличие сообщений с изображениями в ЛС.
 * Если найдено – отправляет изображение в канал и удаляет сообщение.
 * После обработки обновлений выставляет offset, чтобы те же обновления не возвращались.
 * Возвращает true, если хотя бы одно сообщение обработано, иначе false.
 */
async function processTelegramImages() {
	const updates = await getUpdates();
	let processed = false;
	let maxUpdateId = 0;

	for (const update of updates) {
		if (update.update_id && update.update_id > maxUpdateId) {
			maxUpdateId = update.update_id;
		}
		const msg = update.message;
		if (!msg || !msg.chat || msg.chat.type !== 'private' || !msg.photo) {
			continue;
		}
		const chatId = msg.chat.id;
		const messageId = msg.message_id;
		// Берем последний file_id из массива photo (обычно с наибольшим разрешением)
		const fileId = msg.photo[msg.photo.length - 1].file_id;
		const success = await sendToTelegram(fileId, '#предложка');
		if (success) {
			await deleteMessage(chatId, messageId);
			console.log('Изображение из ЛС успешно обработано и отправлено в канал.');
			processed = true;
			const url = `https://api.telegram.org/bot${
				config.telegram.token
			}/getUpdates?offset=${maxUpdateId + 1}`;
			try {
				await axios.get(url);
				console.log('Обновления очищены, offset установлен.');
				return true;
			} catch (err) {
				console.error(
					'Ошибка очистки обновлений:',
					err.response?.data || err.message
				);
			}
		}
	}

	return processed;
}

module.exports = { processTelegramImages };

const { sendToTelegram, deleteMessage } = require('./telegram');
const { getMessageFromDb, deleteMessageFromDb } = require('../services/db');
const config = require('../config');

// Получаем file_id из сообщения
function getFileId(message) {
	const mediaTypes = ['photo', 'video', 'document', 'audio', 'animation'];
	const mediaType = mediaTypes.find((type) => message[type]);
	if (!mediaType) return null;
	const mediaContent = message[mediaType];
	return Array.isArray(mediaContent)
		? mediaContent.pop().file_id
		: mediaContent.file_id;
}

async function processTelegramImages() {
	try {
		// Получаем и удаляем сообщение из базы
		const message = await getMessageFromDb(config.mongoDB.bd2);

		if (!message) {
			console.log('Нет новых сообщений для обработки');
			return false;
		}

		const { chatId, messageId, fileId, caption } = message;

		// Отправляем сообщение в канал
		let success = false;
		if (fileId) {
			success = await sendToTelegram(fileId, caption || '#предложка');
		} else if (caption) {
			success = await sendToTelegram(caption, '#предложка');
		}

		if (success) {
			// Удаляем сообщение из личных сообщений
			await deleteMessage(chatId, messageId);
			console.log(`Сообщение ${message._id} успешно обработано и удалено`);
		} else {
			console.log(`Не удалось обработать сообщение ${message._id}`);
		}

		return success;
	} catch (error) {
		console.error('Ошибка обработки сообщения:', error);
		return false;
	}
}

module.exports = { processTelegramImages, getFileId };

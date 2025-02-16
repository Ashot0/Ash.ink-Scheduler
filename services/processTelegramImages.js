const { sendToTelegram, getUpdates, deleteMessage } = require('./telegram');
const { addPinToDb, writeAllPinsFromDb } = require('./db');

const config = require('../config');
const axios = require('axios');
/**
 * Проверяет обновления Telegram на наличие сообщений с изображениями в ЛС.
 * Если найдено – отправляет изображение в канал и удаляет сообщение.
 * После обработки обновлений выставляет offset, чтобы те же обновления не возвращались.
 * Возвращает true, если хотя бы одно сообщение обработано, иначе false.
 */
async function processTelegramImages() {
	try {
		// Получаем все обработанные ID сообщений
		const processedMessages = await writeAllPinsFromDb(config.mongoDB.bd2);

		// Получаем обновления с самого начала
		const updates = await getUpdates(0);

		// Фильтруем только новые сообщения из ЛС с фото
		const validUpdates = updates.filter((update) => {
			const msg = update.message;
			return (
				msg?.chat?.type === 'private' &&
				msg.photo &&
				!processedMessages.some((m) => m.id === update.update_id)
			);
		});

		if (validUpdates.length === 0) {
			console.log('Нет новых сообщений для обработки');
			return false;
		}

		// Берем самое старое необработанное сообщение
		const oldestUpdate = validUpdates[0];
		const { chat, message_id, photo } = oldestUpdate.message;

		// Отправляем в канал
		const fileId = photo[photo.length - 1].file_id;
		const success = await sendToTelegram(fileId, '#предложка');

		if (success) {
			// Удаляем из ЛС и сохраняем в базу
			await deleteMessage(chat.id, message_id);
			await addPinToDb(oldestUpdate.update_id, config.mongoDB.bd2);
			console.log(`Обработано сообщение ID: ${oldestUpdate.update_id}`);
			return true;
		}

		return false;
	} catch (error) {
		console.error('Ошибка обработки:', error);
		return false;
	}
}

module.exports = { processTelegramImages };

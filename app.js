const { Telegraf } = require('telegraf');
const startServer = require('./server/server');
const { initDb, addMessageToDb } = require('./services/db');
const {
	processPinsFromSpecificBoard,
	processPinsFromAllBoards,
	startSchedule,
} = require('./jobs/schedule');
const {
	testPinterestToken,
	refreshPinterestToken,
} = require('./services/testToken');
const config = require('./config');
const { getFileId } = require('./services/processTelegramImages');

const bot = new Telegraf(config.telegram.token);

async function startApp() {
	try {
		console.log('🚀 Инициализация...');

		// Подключаемся к базе данных
		(async () => {
			await initDb();
			startServer(); // Запускаем сервер после успешного подключения к БД

			bot.launch();
		})();

		console.log('Верификация Pinterest токена...');
		const tokenValid = await testPinterestToken();

		// Если токен недействителен, обновляем его и перезапускаем приложение
		if (!tokenValid) {
			console.error(
				'❌ Ошибка: Токен Pinterest неверный или истек. Обновляем токен...'
			);
			await refreshPinterestToken();
		}

		// Задержка для уменьшения нагрузки при старте
		setTimeout(async () => {
			if (config.pinterest.specificBoardMode === 'true') {
				console.log('📌 Запуск обработки только для одной доски...');
				await processPinsFromSpecificBoard();
			} else {
				console.log('📌 Запуск обработки для всех досок...');
				await processPinsFromAllBoards();
			}
			startSchedule(config.pinterest.specificBoardMode === 'true');
		}, 5000);
	} catch (error) {
		console.error('❌ Ошибка при запуске приложения:', error);
		process.exit(1);
	}
}

startApp();
module.exports = startApp;

bot.on('message', async (ctx) => {
	try {
		const { message } = ctx;
		if (message.chat.type === 'private') {
			const fileId = getFileId(message); // Получаем file_id, если есть медиа
			const caption = message.caption || message.text || ''; // Убедимся, что caption не undefined

			await addMessageToDb(
				{
					chatId: message.chat.id,
					messageId: message.message_id,
					fileId: fileId,
					caption: caption,
					createdAt: new Date(),
				},
				config.mongoDB.bd2
			);

			console.log(`Сообщение добавлено в базу данных`);

			const replyMessage = `
Данные, добавленные в базу данных:
- Chat ID: ${message.chat.id}
- Message ID: ${message.message_id}
- File ID: ${fileId || 'Нет медиафайла'}
- Caption: ${caption || 'Нет текста'}
            `;

			// Отправляем ответ с данными
			await bot.telegram.sendMessage(message.chat.id, replyMessage, {
				reply_to_message_id: message.message_id,
			});
		}
	} catch (error) {
		console.error('Ошибка обработки входящих сообщений:', error);
	}
});

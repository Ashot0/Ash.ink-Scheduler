const startServer = require('./server/server');
const { initDb } = require('./services/db');
const { processTelegramImages } = require('./services/processTelegramImages');
const {
	processPinsFromSpecificBoard,
	processPinsFromAllBoards,
	startSchedule,
} = require('./jobs/schedule');
const { testPinterestToken } = require('./services/testToken');
const config = require('./config');

(async () => {
	try {
		console.log('🚀 Инициализация...');

		// Подключаемся к базе данных
		(async () => {
			await initDb();
			startServer(); // Запускаем сервер после успешного подключения к БД
		})();
		if (config.telegram.lsSpecialWork !== 'false') {
			// Сначала обрабатываем ЛС Telegram
			const telegramImageProcessed = await processTelegramImages();
			if (telegramImageProcessed) {
				console.log(
					'Изображение из Telegram найдено и обработано. Обработка Pinterest пропускается.'
				);
				return;
			}

			// Если в ЛС нет изображений, продолжаем обработку Pinterest
			console.log(
				'Нет изображений в ЛС. Запуск обработки пинов с Pinterest...'
			);
		}
		console.log('Верификация Pinterest токена...');
		const tokenValid = await testPinterestToken();
		if (!tokenValid) {
			console.error('❌ Ошибка: Токен Pinterest неверный или истек.');
			process.exit(1);
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
})();

const startServer = require('./server/server');
const {
	processPinsFromSpecificBoard,
	processPinsFromAllBoards,
	startSchedule,
} = require('./jobs/schedule.js');
const config = require('./config.js');
const { testPinterestToken } = require('./services/testToken.js');
const { initDb } = require('./services/db.js');
const { getAccessToken } = require('./testPinterestAuth.js');

//
//
//
(async () => {
	try {
		console.log('🚀 Инициализация...');

		// Подключение к БД
		(async () => {
			await initDb();
			startServer(); // Запускаем сервер после успешного подключения к БД
		})();

		// Проверка токена Pinterest
		const tokenValid = await testPinterestToken();
		if (!tokenValid) {
			console.error('❌ Ошибка: Токен Pinterest неверный или истек.');
			// Перезапуск
			getAccessToken();
		}

		// Откладываем обработку пинов на 5 секунд (чтобы снизить нагрузку при старте)
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
	} catch (err) {
		console.error('❌ Ошибка при запуске приложения:', err);
		process.exit(1);
	}
})();

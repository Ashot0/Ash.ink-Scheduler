const startServer = require('./server/server');
const { initDb } = require('./services/db.js');
const {
	processPinsFromSpecificBoard,
	processPinsFromAllBoards,
	startSchedule,
} = require('./jobs/schedule.js');
const {
	testPinterestToken,
	refreshPinterestToken,
} = require('./services/testToken');
const config = require('./config.js');
const { getAccessToken } = require('./testPinterestAuth.js');

//
//
//
async function startApp() {
	try {
		console.log('🚀 Инициализация...');

		// Подключение к БД
		(async () => {
			await initDb();
			startServer(); // Запускаем сервер после успешного подключения к БД
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

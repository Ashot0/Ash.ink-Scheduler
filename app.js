const startServer = require('./server/server');
const {
	processPinsFromSpecificBoard,
	processPinsFromAllBoards,
	startSchedule,
} = require('./jobs/schedule.js');
const { specificBoardMode } = require('./config.js');
const { testPinterestToken } = require('./services/testToken.js');

(async () => {
	try {
		console.log('Инициализация...');

		// Проверка токена Pinterest
		const tokenValid = await testPinterestToken();
		if (!tokenValid) {
			console.error('Ошибка: Токен Pinterest неверный или истек.');
			return;
		}
		console.log(specificBoardMode);

		startServer(); // Запуск сервера

		if (specificBoardMode === 'true') {
			console.log('Запуск обработки только для одной доски...');
			await processPinsFromSpecificBoard();
		} else {
			console.log('Запуск обработки для всех досок...');
			await processPinsFromAllBoards();
		}

		startSchedule(specificBoardMode === 'true');
	} catch (err) {
		console.error('Произошла ошибка:', err);
	}
})();

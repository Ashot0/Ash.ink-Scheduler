const dotenv = require('dotenv');

dotenv.config();

module.exports = {
	pinterestToken: process.env.PINTEREST_TOKEN,
	telegramBotToken: process.env.TELEGRAM_TOKEN,
	channelId: process.env.CHANNEL_ID,

	// ID доски
	boardId: process.env.PINTEREST_BOARD_ID,

	// Интервал работы (по умолчанию каждый час)
	scheduleInterval: process.env.SCHEDULE_INTERVAL || '0 * * * *',

	// Порт для запросов на проверку работы сервиса
	port: process.env.PORT || 3000,

	// При true проходит по всем доскам пользователя
	specificBoardMode: process.env.SPECIFIC_BOARD_MODE || 'false',

	// Хранение уже отправленых пинов
	sentPinsFile: './data/sentPins.json',
};

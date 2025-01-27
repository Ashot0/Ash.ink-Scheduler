const dotenv = require('dotenv');

dotenv.config();

module.exports = {
	scheduleInterval: process.env.SCHEDULE_INTERVAL || '0 * * * *', // Интервал расписания
	port: process.env.PORT || 3000,
	sentPinsFile: './data/sentPins.json',

	telegram: {
		token: process.env.TELEGRAM_TOKEN, // Токен Telegram-бота
		channelId: process.env.TELEGRAM_CHANNEL_ID, // ID Telegram-канала
	},

	pinterest: {
		boardId: process.env.PINTEREST_BOARD_ID, // ID Pinterest доски
		userId: process.env.PINTEREST_USER_ID, // ID пользователя
		specificBoardMode: process.env.SPECIFIC_BOARD_MODE || 'false', // Режим прохода по всем доскам
		token: process.env.PINTEREST_TOKEN, // Токен доступа к Pinterest API
		clientId: process.env.PINTEREST_CLIENT_ID, // Идентификатор приложения
		clientSecret: process.env.PINTEREST_CLIENT_SECRET, // Секретный ключ приложения
		authCode: process.env.PINTEREST_AUTH_CODE, // Код авторизации
		redirectUri: process.env.PINTEREST_REDIRECT_URI, // URL перенаправления
		refreshToken: process.env.PINTEREST_REFRESH_TOKEN, // refresh Token для пинтерест
	},
};

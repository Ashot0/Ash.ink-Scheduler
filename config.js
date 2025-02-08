const dotenv = require('dotenv');

dotenv.config();

module.exports = {
	scheduleInterval: process.env.SCHEDULE_INTERVAL || '0 * * * *', // Интервал расписания
	port: process.env.PORT || 4000,

	mongoDB: {
		url: process.env.MONGODB_CONNECTION,
	},

	telegram: {
		token: process.env.TELEGRAM_TOKEN, // Токен Telegram-бота
		channelId: process.env.TELEGRAM_CHANNEL_ID, // ID Telegram-канала
		usernamelId: process.env.TELEGRAM_USERNAME_ID, // ID Telegram-аккаунта
		lsSpecialWork: process.env.LS_SPECIAL_WORK || 'false',
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

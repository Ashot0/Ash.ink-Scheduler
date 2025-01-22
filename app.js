import axios from 'axios';
import schedule from 'node-schedule';
import dotenv from 'dotenv';
dotenv.config();

// Переменные окружения
const pinterestToken = process.env.PINTEREST_TOKEN;
const telegramBotToken = process.env.TELEGRAM_TOKEN;
const channelId = process.env.CHANNEL_ID;
const username = process.env.USERNAME;

let sentPins = new Set();

// Функция для получения пинов пользователя
async function fetchPins() {
	console.log('Запрос пинов от пользователя...');
	const url = `https://api.pinterest.com/v5/users/${username}/pins`;
	try {
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${pinterestToken}`,
			},
		});
		console.log(`Получено ${response.data.items.length} пинов.`);
		return response.data.items; // Массив пинов
	} catch (error) {
		console.error('Ошибка при запросе пинов:', error);
		return [];
	}
}

// Функция для отправки изображений в Telegram
async function sendToTelegram(imageUrl, caption) {
	const url = `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`;
	try {
		console.log('Отправка изображения в Telegram...');
		await axios.post(url, {
			chat_id: channelId,
			photo: imageUrl,
			caption: caption || '',
		});
		console.log('Изображение успешно отправлено в Telegram!');
	} catch (error) {
		console.error('Ошибка отправки в Telegram:', error);
	}
}

// Основная функция для обработки пинов и их отправки в Telegram
async function processPins() {
	console.log('Запуск задачи: проверка новых пинов...');
	const pins = await fetchPins();

	if (pins && pins.length > 0) {
		console.log('Найдено новых пинов. Отправка в Telegram...');
		for (const pin of pins) {
			if (!sentPins.has(pin.id)) {
				console.log(`Отправка пина с ID: ${pin.id}`);
				if (pin.media && pin.media.images && pin.media.images.original) {
					await sendToTelegram(pin.media.images.original.url, pin.title);
					sentPins.add(pin.id);
					await new Promise((resolve) => setTimeout(resolve, 2000));
				} else {
					console.log(`Нет изображения для пина с ID: ${pin.id}`);
				}
			} else {
				console.log(`Пин с ID: ${pin.id} уже отправлен.`);
			}
		}
	} else {
		console.log('Нет новых пинов для отправки.');
	}
}

// Запуск по расписанию (раз в час)
schedule.scheduleJob('0 * * * *', async () => {
	await processPins();
});

console.log('Скрипт запущен. Ожидаем выполнения задачи...');

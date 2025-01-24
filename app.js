import axios from 'axios';
import schedule from 'node-schedule';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pinterestToken = process.env.PINTEREST_TOKEN;
const telegramBotToken = process.env.TELEGRAM_TOKEN;
const channelId = process.env.CHANNEL_ID;
const scheduleInterval = process.env.SCHEDULE_INTERVAL || '0 * * * *'; // По умолчанию раз в час
const sentPinsFile = './sentPins.json';

// Загрузка списка уже отправленных пинов из файла
let sentPins = new Set();
if (fs.existsSync(sentPinsFile)) {
	const data = fs.readFileSync(sentPinsFile, 'utf-8');
	sentPins = new Set(JSON.parse(data));
}

/**
 * Функция запроса списка досок
 */
async function fetchBoards() {
	const url = `https://api.pinterest.com/v5/boards`;

	try {
		const response = await axios.get(url, {
			headers: { Authorization: `Bearer ${pinterestToken}` },
		});
		console.log('Список досок:', response.data.items);

		return response.data.items || [];
	} catch (error) {
		console.error(
			'Ошибка при запросе досок:',
			error.response?.data || error.message
		);

		return [];
	}
}

/**
 * Функция запроса пинов с указанной доски
 */
async function fetchPinsFromBoard(boardId) {
	const url = `https://api.pinterest.com/v5/boards/${boardId}/pins`;

	try {
		const response = await axios.get(url, {
			headers: { Authorization: `Bearer ${pinterestToken}` },
		});
		console.log(`Пины доски ${boardId}:`, response.data.items);
		return response.data.items || [];
	} catch (error) {
		console.error(
			`Ошибка при запросе пинов доски ${boardId}:`,
			error.response?.data || error.message
		);

		return [];
	}
}

/**
 * Поиск изображения с максимальным разрешением
 */
function findHighestResolutionImage(images) {
	let highestResolution = null;

	for (const sizeKey in images) {
		const currentImage = images[sizeKey];
		if (
			!highestResolution ||
			currentImage.width * currentImage.height >
				highestResolution.width * highestResolution.height
		) {
			highestResolution = currentImage;
		}
	}
	return highestResolution ? highestResolution.url : null;
}

/**
 * Отправка изображения в Telegram
 */
async function sendToTelegram(imageUrl, caption) {
	const url = `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`;

	try {
		const response = await axios.post(url, {
			chat_id: channelId,
			photo: imageUrl,
			// Это подпись под изображением при необходимости раскомментировать
			// caption: caption || '',
		});
		console.log('Успешно отправлено в Telegram:', response.data);

		return true;
	} catch (error) {
		console.error(
			'Ошибка отправки в Telegram:',
			error.response?.data || error.message
		);

		return false;
	}
}

/**
 * Сохранение отправленных пинов в файл
 */
function saveSentPins() {
	fs.writeFileSync(sentPinsFile, JSON.stringify([...sentPins]));
}

/**
 * Проверка и обработка пинов (с отправкой только одного пина)
 */
async function processPins() {
	console.log('Запрос списка досок...');
	const boards = await fetchBoards();

	if (!boards.length) {
		console.log('Нет доступных досок.');
		return;
	}

	// Перебираем доски, но отправляем только один пин с каждой
	for (const board of boards) {
		console.log(`Запрос пинов из доски: ${board.name} (${board.id})`);
		const pins = await fetchPinsFromBoard(board.id);

		for (const pin of pins) {
			// Проверяем, обрабатывался ли уже пин
			if (sentPins.has(pin.id)) {
				console.log(`Пин ${pin.id} уже был отправлен.`);
				continue;
			}

			// Проверяем наличие изображения
			const imageUrl = findHighestResolutionImage(pin.media?.images || {});
			if (!imageUrl) {
				console.log(
					`Нет доступного изображения для пина ${pin.id}: ${JSON.stringify(
						pin
					)}`
				);
				continue;
			}

			// Пытаемся отправить изображение в Telegram
			const success = await sendToTelegram(imageUrl, pin.title || ''); // Отправляем с заголовком, если есть
			if (success) {
				sentPins.add(pin.id); // Добавляем ID пина в список отправленных
				saveSentPins(); // Сохраняем список отправленных пинов
				return; // Выход из функции после отправки одного пина
			} else {
				console.log(`Не удалось отправить пин ${pin.id}.`);
			}
		}
	}
}

/**
 * Запланированная задача
 */
schedule.scheduleJob(scheduleInterval, async () => {
	console.log('Запуск запланированной задачи...');
	await processPins();
});

/**
 * Тестовый запуск при старте (отправка одного пина)
 */
(async () => {
	console.log('Инициализация...');
	if (!pinterestToken || !telegramBotToken || !channelId) {
		console.error('Отсутствуют обязательные переменные окружения.');
		process.exit(1);
	}
	await processPins();
})();

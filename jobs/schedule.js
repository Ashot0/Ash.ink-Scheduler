const schedule = require('node-schedule');

const { fetchBoards, fetchPinsFromBoard } = require('../services/pinterest.js');
const { sendToTelegram } = require('../services/telegram.js');
const { findHighestResolutionImage } = require('../services/utils');
const { addPinToDb, writeAllPinsFromDb } = require('../services/db.js');

const config = require('../config');

async function processPinsFromSpecificBoard() {
	if (!config.pinterest.boardId) {
		console.error('Board ID is not specified in .env');
		return;
	}

	console.log(`Запрашиваем пины с доски: ${config.pinterest.boardId}`);

	let bookmark = null; // Начинаем с пустого bookmark
	let morePinsAvailable = true;

	while (morePinsAvailable) {
		// Запрашиваем пины с учетом текущего bookmark
		const { items: pins, bookmark: newBookmark } = await fetchPinsFromBoard(
			config.pinterest.boardId,
			bookmark
		);

		if (!pins.length) {
			console.log('Пины на доске закончились.');
			break;
		}

		const allPinsFromDB = await writeAllPinsFromDb();
		// Обработка пинов
		for (const pin of pins) {
			if (allPinsFromDB.some((pinInDb) => pinInDb.id === pin.id)) {
				console.log(`Пин ${pin.id} уже отправлен.`);
				continue;
			}

			const imageUrl = findHighestResolutionImage(pin.media?.images || {});
			if (!imageUrl) {
				console.log(`У пина ${pin.id} нет изображения.`);
				continue;
			}

			const success = await sendToTelegram(imageUrl, pin.title || '');
			if (success) {
				await addPinToDb(pin.id);
				return; // После успешной отправки завершаем обработку
			}
		}

		// Если есть новый bookmark, продолжаем обрабатывать
		bookmark = newBookmark;
		morePinsAvailable = !!bookmark; // Если есть новый bookmark, продолжаем
	}
}

async function processPinsFromAllBoards() {
	const boards = await fetchBoards();

	if (!boards.length) {
		console.log('Доски не найдены.');
		return;
	}

	for (const board of boards) {
		console.log(`Обрабатываем доску: ${board.name} (${board.id})`);

		let bookmark = null;
		let morePinsAvailable = true;

		while (morePinsAvailable) {
			// Запрашиваем пины с учетом текущего bookmark
			const { items: pins, bookmark: newBookmark } = await fetchPinsFromBoard(
				board.id,
				bookmark
			);

			if (!pins.length) {
				console.log(`Пины на доске ${board.name} закончились.`);
				break;
			}

			const allPinsFromDB = await writeAllPinsFromDb();
			// Обработка пинов
			for (const pin of pins) {
				if (allPinsFromDB.some((pinInDb) => pinInDb.id === pin.id)) {
					console.log(`Пин ${pin.id} уже отправлен.`);
					continue;
				}

				const imageUrl = findHighestResolutionImage(pin.media?.images || {});
				if (!imageUrl) {
					console.log(`У пина ${pin.id} нет изображения.`);
					continue;
				}

				const success = await sendToTelegram(imageUrl, pin.title || '');
				if (success) {
					await addPinToDb(pin.id);
					return;
				}
			}

			// Если есть новый bookmark, продолжаем обрабатывать
			bookmark = newBookmark;
			morePinsAvailable = !!bookmark;
		}
	}
}

// Планировщик с вариативным выбором
function startSchedule(specificBoardMode) {
	schedule.scheduleJob(config.scheduleInterval, async () => {
		console.log('Запускаем задачу...');
		if (specificBoardMode) {
			console.log('Работаем с одной доской...');
			await processPinsFromSpecificBoard();
		} else {
			console.log('Работаем со всеми досками...');
			await processPinsFromAllBoards();
		}
	});
}

module.exports = {
	processPinsFromSpecificBoard,
	processPinsFromAllBoards,
	startSchedule,
};

const schedule = require('node-schedule');
const { fetchBoards, fetchPinsFromBoard } = require('../services/pinterest.js');
const { sendToTelegram } = require('../services/telegram.js');
const { findHighestResolutionImage } = require('../services/utils');
const {
	addPinToDb,
	writeAllPinsFromDb,
	connectToDb,
} = require('../services/db.js');

const config = require('../config');

async function processPinsFromSpecificBoard() {
	if (!config.pinterest.boardId) {
		console.error('Board ID is not specified in .env');
		return;
	}

	try {
		// Дожидаемся подключения к базе данных
		await new Promise((resolve, reject) => {
			connectToDb((err) => {
				if (err) {
					reject('Ошибка подключения к базе данных');
				} else {
					resolve();
				}
			});
		});
		console.log(`Запрашиваем пины с доски: ${config.pinterest.boardId}`);

		let bookmark = null;
		let morePinsAvailable = true;

		while (morePinsAvailable) {
			const { items: pins, bookmark: newBookmark } = await fetchPinsFromBoard(
				config.pinterest.boardId,
				bookmark
			);

			if (!pins.length) {
				console.log('Пины на доске закончились.');
				break;
			}

			const allPinsFromDB = await writeAllPinsFromDb();

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

			bookmark = newBookmark;
			morePinsAvailable = !!bookmark;
		}
	} catch (err) {
		console.error('Ошибка в процессе обработки пинов:', err);
	}
}

async function processPinsFromAllBoards() {
	try {
		await new Promise((resolve, reject) => {
			connectToDb((err) => {
				if (err) {
					reject('Ошибка подключения к базе данных');
				} else {
					resolve();
				}
			});
		});

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
				const { items: pins, bookmark: newBookmark } = await fetchPinsFromBoard(
					board.id,
					bookmark
				);

				if (!pins.length) {
					console.log(`Пины на доске ${board.name} закончились.`);
					break;
				}

				const allPinsFromDB = await writeAllPinsFromDb();

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

				bookmark = newBookmark;
				morePinsAvailable = !!bookmark;
			}
		}
	} catch (err) {
		console.error('Ошибка в процессе обработки пинов с досок:', err);
	}
}

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

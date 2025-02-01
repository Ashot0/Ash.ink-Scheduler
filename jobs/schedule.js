const schedule = require('node-schedule');
const { fetchBoards, fetchPinsFromBoard } = require('../services/pinterest.js');
const { sendToTelegram } = require('../services/telegram.js');
const { findHighestResolutionImage } = require('../services/utils');
const { addPinToDb, writeAllPinsFromDb } = require('../services/db.js');
const config = require('../config');

async function processPinsFromSpecificBoard() {
	if (!config.pinterest.boardId) {
		console.error('❌ Ошибка: Board ID не указан в .env');
		return;
	}

	try {
		console.log(`📌 Получаем пины с доски: ${config.pinterest.boardId}`);
		const allPinsFromDB = await writeAllPinsFromDb(); // Загружаем список отправленных пинов заранее

		let bookmark = null;
		let morePinsAvailable = true;
		let iterationCount = 0;
		const maxIterations = 10; // Предотвращаем бесконечный цикл

		while (morePinsAvailable && iterationCount < maxIterations) {
			iterationCount++;

			const { items: pins, bookmark: newBookmark } = await fetchPinsFromBoard(
				config.pinterest.boardId,
				bookmark
			);

			if (!pins.length) {
				console.log('✅ Все пины на доске обработаны.');
				break;
			}

			for (const pin of pins) {
				if (allPinsFromDB.some((pinInDb) => pinInDb.id === pin.id)) {
					continue; // Пропускаем уже отправленный пин
				}

				const imageUrl = findHighestResolutionImage(pin.media?.images || {});
				if (!imageUrl) continue;

				try {
					const success = await sendToTelegram(imageUrl, pin.title || '');
					if (success) {
						await addPinToDb(pin.id);
						return; // Завершаем обработку после успешной отправки
					}
				} catch (err) {
					console.error(`❌ Ошибка отправки пина ${pin.id}:`, err);
				}
			}

			bookmark = newBookmark;
			morePinsAvailable = !!bookmark;
		}
	} catch (err) {
		console.error('❌ Ошибка обработки пинов:', err);
	}
}

async function processPinsFromAllBoards() {
	try {
		const boards = await fetchBoards();
		if (!boards.length) {
			console.log('❌ Ошибка: Доски не найдены.');
			return;
		}

		const allPinsFromDB = await writeAllPinsFromDb(); // Один раз загружаем список уже отправленных пинов

		for (const board of boards) {
			console.log(`📌 Обрабатываем доску: ${board.name} (${board.id})`);

			let bookmark = null;
			let morePinsAvailable = true;
			let iterationCount = 0;
			const maxIterations = 10; // Предотвращаем бесконечный цикл

			while (morePinsAvailable && iterationCount < maxIterations) {
				iterationCount++;

				const { items: pins, bookmark: newBookmark } = await fetchPinsFromBoard(
					board.id,
					bookmark
				);

				if (!pins.length) {
					console.log(`✅ Все пины на доске ${board.name} обработаны.`);
					break;
				}

				for (const pin of pins) {
					if (allPinsFromDB.some((pinInDb) => pinInDb.id === pin.id)) {
						continue;
					}

					const imageUrl = findHighestResolutionImage(pin.media?.images || {});
					if (!imageUrl) continue;

					try {
						const success = await sendToTelegram(imageUrl, pin.title || '');
						if (success) {
							await addPinToDb(pin.id);
							return;
						}
					} catch (err) {
						console.error(`❌ Ошибка отправки пина ${pin.id}:`, err);
					}
				}

				bookmark = newBookmark;
				morePinsAvailable = !!bookmark;
			}
		}
	} catch (err) {
		console.error('❌ Ошибка обработки пинов с досок:', err);
	}
}

function startSchedule(specificBoardMode) {
	schedule.scheduleJob(config.scheduleInterval, async () => {
		console.log('⏳ Запускаем задачу...');
		if (specificBoardMode) {
			console.log('🎯 Режим одной доски.');
			await processPinsFromSpecificBoard();
		} else {
			console.log('🔄 Режим всех досок.');
			await processPinsFromAllBoards();
		}
	});
}

module.exports = {
	processPinsFromSpecificBoard,
	processPinsFromAllBoards,
	startSchedule,
};

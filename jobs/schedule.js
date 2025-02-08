const schedule = require('node-schedule');
const { fetchBoards, fetchPinsFromBoard } = require('../services/pinterest');
const { sendToTelegram } = require('../services/telegram');
const { findHighestResolutionImage } = require('../services/utils');
const { addPinToDb, writeAllPinsFromDb } = require('../services/db');
const config = require('../config');

async function processPinsFromSpecificBoard() {
	if (!config.pinterest.boardId) {
		console.error('❌ Ошибка: Board ID не указан в .env');
		return;
	}
	try {
		console.log(`📌 Получаем пины с доски: ${config.pinterest.boardId}`);
		const allPinsFromDB = await writeAllPinsFromDb();
		let bookmark = null;
		let morePinsAvailable = true;
		let iterationCount = 0;
		const maxIterations = 10;
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
				} catch (error) {
					console.error(`❌ Ошибка отправки пина ${pin.id}:`, error);
				}
			}
			bookmark = newBookmark;
			morePinsAvailable = !!bookmark;
		}
	} catch (error) {
		console.error('❌ Ошибка обработки пинов:', error);
	}
}

async function processPinsFromAllBoards() {
	// Реализация аналогична processPinsFromSpecificBoard
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

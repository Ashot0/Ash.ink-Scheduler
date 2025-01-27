const fs = require('fs');
const config = require('../config');

// Загрузка списка отправленных пинов
function loadSentPins() {
	if (fs.existsSync(config.sentPinsFile)) {
		const data = fs.readFileSync(config.sentPinsFile, 'utf-8');
		return new Set(JSON.parse(data));
	}
	return new Set();
}

// Сохранение списка отправленных пинов
function saveSentPins(sentPins) {
	fs.writeFileSync(config.sentPinsFile, JSON.stringify([...sentPins]));
}

// Поиск изображения с максимальным разрешением
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

module.exports = { loadSentPins, saveSentPins, findHighestResolutionImage };

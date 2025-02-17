const { startApp } = require('../app.js');

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

function restartApp() {
	console.log('🔄 Перезапуск приложения...');
	setTimeout(() => startApp, 1000);
}

module.exports = { findHighestResolutionImage, restartApp };

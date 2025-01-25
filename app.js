import axios from 'axios';
import schedule from 'node-schedule';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pinterestToken = process.env.PINTEREST_TOKEN;
const telegramBotToken = process.env.TELEGRAM_TOKEN;
const channelId = process.env.CHANNEL_ID;
const scheduleInterval = process.env.SCHEDULE_INTERVAL || '0 * * * *'; //Default once per hour
const sentPinsFile = './sentPins.json';

// Loading a list of already sent pins from a file
let sentPins = new Set();
if (fs.existsSync(sentPinsFile)) {
	const data = fs.readFileSync(sentPinsFile, 'utf-8');
	sentPins = new Set(JSON.parse(data));
}

/**
 * Board list request function
 */
async function fetchBoards() {
	const url = `https://api.pinterest.com/v5/boards`;

	try {
		const response = await axios.get(url, {
			headers: { Authorization: `Bearer ${pinterestToken}` },
		});
		console.log('List of boards:', response.data.items);

		return response.data.items || [];
	} catch (error) {
		console.error(
			'Error when requesting boards:',
			error.response?.data || error.message
		);

		return [];
	}
}

/**
 * Function to request pins from a specified board
 */
async function fetchPinsFromBoard(boardId) {
	const url = `https://api.pinterest.com/v5/boards/${boardId}/pins`;

	try {
		const response = await axios.get(url, {
			headers: { Authorization: `Bearer ${pinterestToken}` },
		});
		console.log(`Board Pins ${boardId}:`, response.data.items);
		return response.data.items || [];
	} catch (error) {
		console.error(
			`Error when requesting board pins ${boardId}:`,
			error.response?.data || error.message
		);

		return [];
	}
}

/**
 * Search for an image with maximum resolution
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
 * Sending an image to Telegram
 */
async function sendToTelegram(imageUrl, caption) {
	const url = `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`;

	try {
		const response = await axios.post(url, {
			chat_id: channelId,
			photo: imageUrl,
			// This description is under the image if necessary, uncomment
			// caption: caption || '',
		});
		console.log('Successfully sent to Telegram:', response.data);

		return true;
	} catch (error) {
		console.error(
			'Error sending to Telegram:',
			error.response?.data || error.message
		);

		return false;
	}
}

/**
 * Saving sent pins to a file
 */
function saveSentPins() {
	fs.writeFileSync(sentPinsFile, JSON.stringify([...sentPins]));
}

/**
 * Validation and processing of pins (with only one pin sent)
 */
async function processPins() {
	console.log('Request a list of boards...');
	const boards = await fetchBoards();

	if (!boards.length) {
		console.log('No boards available.');
		return;
	}

	// We go through the boards, but only send one pin from each
	for (const board of boards) {
		console.log(`Request Pins from a Board: ${board.name} (${board.id})`);
		const pins = await fetchPinsFromBoard(board.id);

		for (const pin of pins) {
			// Checking whether the pin has already been processed
			if (sentPins.has(pin.id)) {
				console.log(`Pin ${pin.id} has already been sent.`);
				continue;
			}

			// Checking for the presence of an image
			const imageUrl = findHighestResolutionImage(pin.media?.images || {});
			if (!imageUrl) {
				console.log(`No pin image available ${pin.id}: ${JSON.stringify(pin)}`);
				continue;
			}

			// Trying to send an image to Telegram
			const success = await sendToTelegram(imageUrl, pin.title || ''); // Send with header, if available.
			if (success) {
				sentPins.add(pin.id); // Add the pin ID to the sent list
				saveSentPins(); // Save a list of sent pins
				return; // Exiting the function after sending one pin
			} else {
				console.log(`Failed to send pin ${pin.id}.`);
			}
		}
	}
}

/**
 * Scheduled task
 */
schedule.scheduleJob(scheduleInterval, async () => {
	console.log('Run a scheduled task...');
	await processPins();
});

/**
 * Test run at startup (sending one pin)
 */
(async () => {
	console.log('Initialization...');
	if (!pinterestToken || !telegramBotToken || !channelId) {
		console.error('Required environment variables are missing.');
		process.exit(1);
	}
	await processPins();
})();

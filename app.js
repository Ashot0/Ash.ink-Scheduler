import express from 'express';
import axios from 'axios';
import schedule from 'node-schedule';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

// Environment variables
const pinterestToken = process.env.PINTEREST_TOKEN;
const telegramBotToken = process.env.TELEGRAM_TOKEN;
const channelId = process.env.CHANNEL_ID;
const scheduleInterval = process.env.SCHEDULE_INTERVAL || '0 * * * *'; // Default: once an hour
const dbPath = process.env.DATABASE_PATH || 'pins.db';

// SQLite database setup
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS sent_pins (
    id TEXT PRIMARY KEY, 
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
	res.send('App is running');
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

// Prevent overlapping tasks
let isProcessing = false;

/**
 * Check if a pin has already been sent
 */
function isPinSent(pinId) {
	const stmt = db.prepare('SELECT id FROM sent_pins WHERE id = ?');
	return !!stmt.get(pinId); // Returns true if a record is found
}

/**
 * Add a pin to the sent history
 */
function markPinAsSent(pinId) {
	const stmt = db.prepare('INSERT INTO sent_pins (id) VALUES (?)');
	stmt.run(pinId);
}

/**
 * Function to fetch the list of boards
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
 * Function to fetch pins from a specific board
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
 * Find the image with the highest resolution
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
 * Send an image to Telegram
 */
async function sendToTelegram(imageUrl, caption) {
	const url = `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`;

	try {
		const response = await axios.post(url, {
			chat_id: channelId,
			photo: imageUrl,
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
 * Check and process pins (sending one pin)
 */
async function processPins() {
	if (isProcessing) {
		console.log('Task is already running. Skipping...');
		return;
	}

	isProcessing = true; // Block other tasks
	console.log('Request a list of boards...');

	try {
		const boards = await fetchBoards();

		if (!boards.length) {
			console.log('No boards available.');
			return;
		}

		// Process boards, sending only one pin from each
		for (const board of boards) {
			console.log(`Request Pins from a Board: ${board.name} (${board.id})`);
			const pins = await fetchPinsFromBoard(board.id);

			for (const pin of pins) {
				// Check if the pin has already been sent
				if (isPinSent(pin.id)) {
					console.log(`Pin ${pin.id} has already been sent.`);
					continue;
				}

				// Check for image availability
				const imageUrl = findHighestResolutionImage(pin.media?.images || {});
				if (!imageUrl) {
					console.log(
						`No pin image available ${pin.id}: ${JSON.stringify(pin)}`
					);
					continue;
				}

				// Attempt to send the image to Telegram
				const success = await sendToTelegram(imageUrl, pin.title || '');
				if (success) {
					markPinAsSent(pin.id); // Add the pin ID to the database
					return; // Stop after sending one pin
				} else {
					console.log(`Failed to send pin ${pin.id}.`);
				}
			}
		}
	} catch (error) {
		console.error('Error during pin processing:', error.message);
	} finally {
		isProcessing = false; // Release the lock
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
 * Test run on startup (sending one pin)
 */
// (async () => {
// 	console.log('Initialization...');
// 	if (!pinterestToken || !telegramBotToken || !channelId) {
// 		console.error('Required environment variables are missing.');
// 		process.exit(1);
// 	}
// 	await processPins();
// })();

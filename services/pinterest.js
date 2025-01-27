const axios = require('axios');
const config = require('../config');

/**
 * Получение списка досок
 */
async function fetchBoards() {
	const url = `https://api.pinterest.com/v5/boards`;

	try {
		const response = await axios.get(url, {
			headers: { Authorization: `Bearer ${config.pinterest.token}` },
		});
		console.log(response.data);

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
 * Получение пинов с определённой доски
 */
async function fetchPinsFromBoard(boardId, bookmark = null) {
	const url = `https://api.pinterest.com/v5/boards/${boardId}/pins`;

	const params = bookmark ? { bookmark } : {};

	try {
		const response = await axios.get(url, {
			headers: { Authorization: `Bearer ${config.pinterest.token}` },
			params,
		});
		// console.log(response.data);

		const newBookmark = response.data.bookmark || null;

		return { items: response.data.items || [], bookmark: newBookmark };
	} catch (error) {
		console.error(
			`Ошибка при запросе пинов с доски ${boardId}:`,
			error.response?.data || error.message
		);
		return { items: [], bookmark: null };
	}
}

module.exports = { fetchBoards, fetchPinsFromBoard };

const axios = require('axios');
const config = require('../config');

// Конфигурация Axios
const axiosInstance = axios.create({
	baseURL: 'https://api.pinterest.com/v5/',
	headers: { Authorization: `Bearer ${config.pinterest.token}` },
});

/**
 * Получение списка досок
 */
async function fetchBoards() {
	try {
		const response = await axiosInstance.get('boards');
		console.log(response.data);
		return response.data.items || [];
	} catch (error) {
		console.error('Ошибка при запросе досок:', getErrorMessage(error));
		return [];
	}
}

/**
 * Получение пинов с определённой доски
 */
async function fetchPinsFromBoard(boardId, bookmark = null) {
	const params = bookmark ? { bookmark } : {};

	try {
		const response = await axiosInstance.get(`boards/${boardId}/pins`, {
			params,
		});
		const newBookmark = response.data.bookmark || null;
		return { items: response.data.items || [], bookmark: newBookmark };
	} catch (error) {
		console.error(
			`Ошибка при запросе пинов с доски ${boardId}:`,
			getErrorMessage(error)
		);
		return { items: [], bookmark: null };
	}
}

/**
 * Утилита для получения удобных сообщений об ошибках
 */
function getErrorMessage(error) {
	if (error.response) {
		// Ошибка от Pinterest API
		return error.response.data || error.response.statusText;
	} else if (error.request) {
		// Нет ответа от сервера
		return 'Нет ответа от сервера';
	} else {
		// Другая ошибка
		return error.message || 'Неизвестная ошибка';
	}
}

module.exports = { fetchBoards, fetchPinsFromBoard };

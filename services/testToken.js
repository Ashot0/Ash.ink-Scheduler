const axios = require('axios');
const { pinterestToken } = require('../config');

async function testPinterestToken() {
	const url = 'https://api.pinterest.com/v5/user_account'; // Верификация токена

	try {
		console.log('Верификация Pinterest токена...');

		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${pinterestToken}`,
			},
		});
		console.log('Успешная аутентификация, Ваш user_id:', response.data.id);

		return true;
	} catch (error) {
		console.error(
			'Ошибка верификации токена:',
			error.response?.data || error.message
		);

		return false;
	}
}

module.exports = {
	testPinterestToken,
};

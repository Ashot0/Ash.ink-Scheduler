import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pinterestToken = process.env.PINTEREST_TOKEN;

async function testPinterestToken() {
	const url = 'https://api.pinterest.com/v5/user_account'; // Проверка токена
	try {
		console.log('Проверка токена Pinterest...');
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${pinterestToken}`,
			},
		});
		console.log('Успешная аутентификация. Ваш user_id:', response.data.id);
	} catch (error) {
		console.error(
			'Ошибка проверки токена:',
			error.response?.data || error.message
		);
	}
}

testPinterestToken();

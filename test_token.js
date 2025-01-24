import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pinterestToken = process.env.PINTEREST_TOKEN;

async function testPinterestToken() {
	const url = 'https://api.pinterest.com/v5/user_account'; // Token verification

	try {
		console.log('Pinterest Token Verification...');
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${pinterestToken}`,
			},
		});
		console.log('Successful authentication. Your user_id:', response.data.id);
	} catch (error) {
		console.error(
			'Token verification error:',
			error.response?.data || error.message
		);
	}
}

testPinterestToken();

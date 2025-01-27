(async () => {
	const open = (await import('open')).default;
	const configEnv = require('./config.js');

	const url = `https://www.pinterest.com/oauth/?client_id=${configEnv.pinterest.clientId}&redirect_uri=${configEnv.pinterest.redirectUri}&response_type=code&scope=pins:read,boards:read,user_accounts:read`;

	console.log(url);

	// Открываем ссылку в браузере
	open(url);
})();

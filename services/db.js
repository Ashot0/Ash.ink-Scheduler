const { MongoClient } = require('mongodb');
const config = require('../config');

const URL = config.mongoDB.url;
let DBConnection = null; // Храним подключение в памяти

async function initDb() {
	if (DBConnection) {
		console.log('📦 Уже подключено к MongoDB');
		return;
	}

	try {
		const client = new MongoClient(URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		await client.connect();
		DBConnection = client.db();
		console.log('✅ Успешное подключение к MongoDB');
	} catch (err) {
		console.error('❌ Ошибка подключения к MongoDB:', err);
		process.exit(1); // Завершаем процесс, чтобы перезапустить сервер
	}
}

async function addPinToDb(id) {
	if (!DBConnection) throw new Error('❌ Ошибка: База данных не подключена');

	const myColl = DBConnection.collection('sentPinsTestPb');
	try {
		const result = await myColl.insertOne({ id });
		console.log(`✅ Пин добавлен в базу: ${result.insertedId}`);
	} catch (err) {
		console.error('❌ Ошибка добавления пина:', err);
	}
}

async function writeAllPinsFromDb() {
	if (!DBConnection) throw new Error('❌ Ошибка: База данных не подключена');

	const myColl = DBConnection.collection('sentPinsTestPb');
	try {
		return await myColl.find().toArray();
	} catch (err) {
		console.error('❌ Ошибка загрузки пинов из базы:', err);
		return [];
	}
}

module.exports = {
	initDb,
	addPinToDb,
	writeAllPinsFromDb,
	getDb: () => DBConnection,
};

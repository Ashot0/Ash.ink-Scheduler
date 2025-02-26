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

async function addMessageToDb(message, collectionName) {
	if (!DBConnection) throw new Error('❌ Ошибка: База данных не подключена');
	const collection = DBConnection.collection(collectionName);

	try {
		// Убедимся, что все поля корректны
		const document = {
			chatId: message.chatId,
			messageId: message.messageId,
			fileId: message.fileId || null, // Если fileId отсутствует, используем null
			caption: '#предложка', // Если caption отсутствует, используем пустую строку
			createdAt: new Date(), // Добавляем текущую дату
		};

		// Вставляем документ в коллекцию
		const result = await collection.insertOne(document);
		console.log(`✅ Сообщение добавлено с ID: ${result.insertedId}`);
	} catch (err) {
		console.error('❌ Ошибка добавления сообщения:', err);
	}
}

// Получаем одно сообщение из базы данных
async function getMessageFromDb(collectionName) {
	if (!DBConnection) throw new Error('❌ Ошибка: База данных не подключена');
	const collection = DBConnection.collection(collectionName);
	try {
		// Находим самое старое сообщение
		const message = await collection.findOne({}, { sort: { createdAt: 1 } });

		if (!message) {
			console.log('Нет сообщений для обработки');
			return null;
		}

		// Удаляем найденное сообщение
		await collection.deleteOne({ _id: message._id });
		console.log(`Сообщение ${message._id} удалено из базы данных`);

		return message;
	} catch (err) {
		console.error('❌ Ошибка получения сообщения:', err);
		return null;
	}
}

// Удаляем сообщение из базы данных
async function deleteMessageFromDb(messageId, collectionName) {
	if (!DBConnection) throw new Error('❌ Ошибка: База данных не подключена');
	const collection = DBConnection.collection(collectionName);
	try {
		await collection.deleteOne({ id: messageId });
		console.log(`✅ Сообщение ${messageId} удалено из базы`);
	} catch (err) {
		console.error('❌ Ошибка удаления сообщения:', err);
	}
}

async function addPinToDb(id, collection) {
	if (!DBConnection) throw new Error('❌ Ошибка: База данных не подключена');

	const myColl = DBConnection.collection(collection);
	try {
		const result = await myColl.insertOne({ id });
		console.log(`✅ Пин добавлен в базу: ${result.insertedId}`);
	} catch (err) {
		console.error('❌ Ошибка добавления пина:', err);
	}
}

async function writeAllPinsFromDb(collection) {
	if (!DBConnection) throw new Error('❌ Ошибка: База данных не подключена');

	const myColl = DBConnection.collection(collection);
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
	addMessageToDb,
	getMessageFromDb,
	deleteMessageFromDb,
};

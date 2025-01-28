const { MongoClient } = require('mongodb');
const config = require('../config');

const URL = config.mongoDB.url;

let DBConnection;

const addPinToDbAsync = async (id) => {
	if (!DBConnection) {
		throw new Error('Database not connected');
	}

	const db = DBConnection;
	const myColl = db.collection('sentPins');
	const doc = { id: id };
	try {
		const result = await myColl.insertOne(doc);
		console.log(`Pin added with the _id: ${result.insertedId}`);
	} catch (err) {
		console.log('Error adding pin:', err);
		throw err;
	}
};

const writeAllPinsFromDbAsync = async () => {
	if (!DBConnection) {
		throw new Error('Database not connected');
	}

	const db = DBConnection;
	const myColl = db.collection('sentPins');
	try {
		const result = await myColl.find().toArray();
		return result;
	} catch (err) {
		console.log('Error fetching pins:', err);
		throw err;
	}
};

module.exports = {
	connectToDb: (cb) => {
		MongoClient.connect(URL)
			.then((client) => {
				console.log('Connected to MongoDB');
				DBConnection = client.db();
				return cb(null); // Соединение установлено, передаем null как ошибку
			})
			.catch((err) => {
				console.error('Error connecting to MongoDB:', err);
				return cb(err); // Передаем ошибку в callback
			});
	},
	getDb: () => DBConnection,
	addPinToDb: (id) => addPinToDbAsync(id),
	writeAllPinsFromDb: writeAllPinsFromDbAsync,
};

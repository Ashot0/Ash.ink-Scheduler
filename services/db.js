const { MongoClient } = require('mongodb');
const config = require('../config');

const URL = config.mongoDB.url;

let DBConnection;

const addPinToDbAsync = async (id) => {
	const db = DBConnection;
	const myColl = db.collection('sentPins');
	const doc = { id: id };
	try {
		const result = await myColl.insertOne(doc);
		console.log(`Pin add with the _id: ${result.insertedId}`);
	} catch (err) {
		console.log('Error pin add:', err);
	}
};

const writeAllPinsFromDbAsync = async () => {
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
				console.log('Connect to MongoDB');
				DBConnection = client.db();
				return cb();
			})
			.catch((err) => {
				return cb();
			});
	},
	getDb: () => DBConnection,
	addPinToDb: (id) => addPinToDbAsync(id),
	writeAllPinsFromDb: writeAllPinsFromDbAsync,
};

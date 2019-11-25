var mongoose = require('mongoose');

const mongoIP = process.env.MONGODB_IP;
const mongoPort = process.env.MONGODB_PORT;

const connString = `mongodb://${mongoIP ? mongoIP : '172.17.0.1'}:${mongoPort ? mongoPort : '27017'}/housecarl-manager`;
console.log("connString", connString);

mongoose.connect(connString);

var sensorSchema = new mongoose.Schema({
    sensor: String,
    value: Object,
}, { collection: "sensors" });

var sensors = mongoose.model('sensors', sensorSchema, 'sensors');

var check = () => {
    return mongoose.connection.db.databaseName === 'housecarl-manager';
};

module.exports = { sensors, check };

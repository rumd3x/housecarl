var mongoose = require('mongoose');

const mongoIP = process.env.MONGODB_IP;
const mongoPort = process.env.MONGODB_PORT;

const connString = `mongodb://${mongoIP ? mongoIP : '127.0.0.1'}:${mongoPort ? mongoPort : '27017'}/housecarl-manager`;
console.log("connString", connString);

mongoose.connect(connString);

var sensorsSchema = new mongoose.Schema({
    sensor: String,
    value: Object,
}, { collection: "sensors" });

const sensors = () => {
    return mongoose.model('sensors', sensorsSchema, 'sensors');
};

module.exports = { sensors };

const mongoose = require('mongoose')

const mongoIP = process.env.MONGODB_IP
const mongoPort = process.env.MONGODB_PORT

const connString = `mongodb://${mongoIP ? mongoIP : '172.17.0.1'}:${mongoPort ? mongoPort : '27017'}/housecarl-manager`
console.log("connString", connString)

mongoose.connect(connString)

const sensorSchema = new mongoose.Schema({
    sensor: String,
    value: Object,
}, { collection: "sensors" })

const handlerSchema = new mongoose.Schema({
    key: String,
    data: Object,
}, { collection: "handlers" })

const logSchema = new mongoose.Schema({
    meta: [{ key: String, value: String }],
    date: { type: Date, default: Date.now },
    level: Number,
}, { collection: "logs" })

const sensors = mongoose.model('sensors', sensorSchema, 'sensors')
const logs = mongoose.model('logs', logSchema, 'logs')
const handlers = mongoose.model('handlers', handlerSchema, 'handlers')

const saveSensorReading = async (key, value) => {

    sensors.findOne({ sensor: key }, (err, reading) => {

        if (err) {
            console.error(err)
            return false
        }

        if (!reading) {
            let reading = new sensors({ sensor: key, value: value })

            reading.save((err) => {
                if (err) {
                    console.error(err)
                    return false
                }

                console.log(`Sensor ${key} was inserted for the first time with value ${value}`)
                return true
            })

        } else {

            reading.updateOne({ value: value }, (err) => {
                if (err) {
                    console.error(err)
                    return false
                }

                console.log(`Sensor ${key} updated to ${value}`)
                return true
            })
        }
    })
}

const getSensorReading = async (sensor) => {
    return await sensors.findOne({ sensor: sensor }).then(
        (reading) => {
            return reading.value
        },
        (err) => {
            console.warn(`Sensor reading ${sensor} not found`)
            return null
        }
    )
}

const putHandlerData = async (key, data) => {
    return await handlers.findOneAndUpdate({ key: key }, { data: data })
        .lean()
        .then((document) => {
            if (document) return document

            document = new handlers({ key: key, data: data })
            document.save()
                .then((document) => {
                    return document
                }).catch((e) => {
                    console.error(e)
                    throw new Error(e)
                })
        }).catch((e) => {
            console.error(e)
            throw new Error(e)
        })

}

const getHandlerDataWithDefault = async (key, def) => {
    return await handlers.findOne({ key: key })
        .lean()
        .then((document) => {
            if (!document) return def

            return document.data
        }).catch((e) => {
            console.warn(e)
            return def
        })
}

const insertLogObject = async (logObject) => {
    let log = new logs()

    log.save((err) => {
        if (err) {
            console.error(`Failed to save log`, err)
            return false
        }

        console.error(`Log inserted succesfully ${JSON.stringify(logObject)}`, err)
        return true
    })
}

const check = () => {
    return mongoose.connection.db.databaseName === 'housecarl-manager'
}

module.exports = { sensors, logs, putHandlerData, getHandlerDataWithDefault, check, saveSensorReading, insertLogObject, getSensorReading }

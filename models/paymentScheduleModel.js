const { mongoose, conn } = require("../config/db");

const paymentSchema = new mongoose.Schema({
    schedule: {
        type: Number,
        default: 0 // 0 means Monthly, 1 for weekly
    },
    date: {
        type: Number, //show on monthly schedule
    },
    time: {
        type: String,
        required: true
    },
    day: {
        type: Number // show on weekly schedule
    }
},{
    strict: true,
    timestamp: true,
    versionKey: false,
    collection: "paymentSchedule"
});

exports.paymentScheduleModel = mongoose.model('paymentSchedule',paymentSchema);
var { mongoose, conn } = require('../config/db');

const timeslotSchema = new mongoose.Schema({
    timestamp: {
        type: Number,
        require: true
    },
    timeslot: [{
        type: mongoose.Types.ObjectId,
        ref: "slotsTime"
    }],
    holidays: [{
        type: Number
    }],
    created_by: {
        type: mongoose.Types.ObjectId,
        ref: 'ustaad'
    },
    working_days: [Number]
},
    {
        strict: true,
        collection: 'timeslot',
        versionKey: false
    }
);

exports.timeslotModel = mongoose.model('timeslot', timeslotSchema);
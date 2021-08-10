const { conn, mongoose } = require("../config/db");

let slotsSchema = new mongoose.Schema({
    day: {
        type: Number
    },
    created_by: {
        type: mongoose.Types.ObjectId,
        ref: 'ustaad'
    },
    time: [{
        slots: {
            type: String
        },
        is_active: {
            type: Boolean,
            default: false
        }
    }]
}, {
    strict: true,
    collection: "slotsTime",
    timestamps: true,
    versionKey: false
});

exports.slotsOfTimeModel = mongoose.model('slotsTime', slotsSchema);

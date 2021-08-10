let { mongoose, conn } = require("../config/db");

const chargesSchema = new mongoose.Schema({
    service_charges: {
        type: Number,
        default: 0
    },
    transaction_charges: {
        type: Number,
        default: 0
    },
    delivery_charges: [{
        to: Number,
        from: Number,
        charge: Number
    }]
}, {
    strict: true,
    collection: 'charges',
    versionKey: false
});

exports.chargesModel = mongoose.model('charges', chargesSchema);
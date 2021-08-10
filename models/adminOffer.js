const { mongoose, conn } = require('../config/db');

const adminOfferSchema = mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    dateFrom: {
        type: String
    },
    dateTo: {
        type: String
    },
    minimum: {
        type: Number
    },
    maximum: {
        type: Number
    },
    paymentMethod: {
        type: Number,
        default: 0  // 0 for cash on delivery , 1 for Card, 2 for wallet .
    },
    paymentBank: {
        type: String
    },
    discount: {
        type: String
    },
    is_block: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Number,
        default: Date.now
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    collection: 'adminOffer',
    versionKey: false,
    strict: true
});

exports.adminOfferModel = mongoose.model('adminOffer', adminOfferSchema);
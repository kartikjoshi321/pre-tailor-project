var { mongoose, conn } = require('../config/db');

const promotionalSchema = new mongoose.Schema({
    title: {
        type: String,
        default: null
    },
    categories: [{
        type: mongoose.Types.ObjectId,
        ref: 'category'
    }],
    discount_percentage: {
        type: Number,
        default: 0
    },
    transactionId: {
        type: String,
        default: null
    },
    posting_period: {
        type: Number,
        default: 0
    },
    tailorId: {
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    image: {
        type: String,
        default: null
    },
    charges: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 0 //0 for pending, 1 for approved, 2 for rejected in offerList
    },
    payment_type: {
        type: Number,
        default: 0  // 0 for cash 1 for payment gateway
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Number,
        default: new Date().getTime()
    },
    updated_at: {
        type: Number,
        default: new Date().getTime()
    }
},
    {
        strict: true,
        collection: 'promotional',
        versionKey: false
    }
);

exports.promotionalModel = mongoose.model('promotional', promotionalSchema);
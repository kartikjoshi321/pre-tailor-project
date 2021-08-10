const { mongoose, conn } = require('../config/db');
const generateUniqueId = require('generate-unique-id');

const orderListSchema = mongoose.Schema(
    {
        tailorId: {
            type: mongoose.Types.ObjectId,
            ref: 'tailor'
        },
        color: {
            type: mongoose.Types.ObjectId,
            ref: 'productColor'
        },
        offerId: {
            type: String
        },
        productId: {
            type: mongoose.Types.ObjectId,
            ref: 'product'
        },
        brandId: {
            type: mongoose.Types.ObjectId,
            ref: 'productBrand'
        },
        refer: {
            type: Number,
            default: 0
        },
        wallet: {
            type: Number,
            default: 0
        },
        transaction_charge: {
            type: Number,
            default: 0
        },
        delivery_charge: {
            type: Number,
            default: 0
        },
        service_charge: {
            type: Number,
            default: 0
        },
        transactionId: {
            type: String,
            default: ''
        },
        size: {
            type: String,
            required: true
        },
        orderId: {
            type: String,
            default: generateUniqueId({
                length: 7,
                useLetters: true
            }).toUpperCase()
        },
        price: {
            type: Number,
            required: true
        },
        commission: {
            type: Number
        },
        complete_payment: {
            type: Number,
            default: 0
        },
        pay_date: {
            type: Number,
        },
        quantity: {
            type: Number,
            default: 1
        },
        unit_price: {
            type: Number,
            default: 0
        },
        dispatch_on: {
            type: Number,
            default: 0
        },
        created_at: {
            type: Number,
            default: Date.now
        },
        modified_at: {
            type: Number,
            default: Date.now
        },
        deliverby: {
            type: String,
            default: '5 Days'
        },
        delivery_on: {
            type: Number,
            default: Date.now() + 5 * 24 * 60 * 60 * 60
        },
        reason: {
            type: String
        },
        reasonBy: {
            type: Number,
            default: 0
        },
        status: {
            type: Number,
            default: 0 // 0 for pending
        },

        skuId: {
            type: String,
            default: generateUniqueId({
                length: 7,
                useLetters: true
            }).toUpperCase()
        },
        created_by: {
            type: mongoose.Types.ObjectId,
            ref: 'user',
            required: true
        },
        dispatch_on: {
            type: Number,
            default: 0
        }
    }, {
    collection: 'orderList',
    versionKey: false,
    strict: true
});

exports.orderListModel = mongoose.model('orderList', orderListSchema);

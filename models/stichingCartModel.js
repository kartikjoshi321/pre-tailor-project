const { ObjectId } = require('bson');
const { mongoose, conn } = require('../config/db');

const stichingCartSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        required: true
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
    memberId: {
        type: String,
        default: ''
    },
    reason: {
        type: String
    },
    packed_in: {
        type: Number 
    },
    reasonBy: {
        type: Number,
        default: 0
    },
    offer: {
        type: mongoose.Types.ObjectId,
        ref: 'adminOffer'
    },
    brandId: {
        type: mongoose.Types.ObjectId,
        ref: 'fabricBrand',
        required: true
    },
    fabricTypeId: {
        type: mongoose.Types.ObjectId,
        ref: 'fabricType',
        required: true
    },
    fabricId: {
        type: mongoose.Types.ObjectId,
        ref: 'fabric',
        required: true
    },
    color: {
        type: mongoose.Types.ObjectId,
        ref: 'fabricColor',
        required: true
    },
    status: {
        type: Number,
        default: 0 //0 for cart and 1 for save For later
    },
    dispatch_on: {
        type: Number,
        default: 0
    },
    distance: {
        type: Number,
        default: 0
    },
    delivery_on: {
        type: Number,
        default: Date.now() + 5 * 24 * 60 * 60 * 60
    },
    isMeasurement: {
        type: Boolean,
        default: false
    },
    tailorId: {
        type: mongoose.Types.ObjectId,
        ref: 'tailor',
        required: true
    },
    fabricPrice: {
        type: Number,
        default: 0
    },
    complete_payment: {
        type: Number,
        default: 0
    },
    pay_date: {
        type: Number,
    },
    remainingPrice: {
        type: Number,
        default: 0
    },
    stitchingPrice: {
        type: Number,
        default: 0
    },
    commission: {
        type: Number
    },
    quantity: {
        type: Number,
        default: 1,
        required: true
    },
    measurmentId: {
        type: mongoose.Types.ObjectId,
        ref: 'measurment'
    },
    modelId: {
        type: mongoose.Types.ObjectId,
        ref: 'kundura'
    },
    recordMeasurment: {
        type: mongoose.Types.ObjectId,
        ref: 'recordmeasurment'
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Number,
        default: Date.now
    },
    skuId: {
        type: String,
        default: ""
    },
    orderId: {
        type: String,
        default: ""
    },
    modified_at: {
        type: Number,
        default: Date.now
    },
    ustaad_status: {
        type: String
    },
    ustaadId: {
        type: mongoose.Types.ObjectId,
        ref: "ustaad"
    },
    paid: {
        type: Boolean,
        default: false
    }
}, {
    collection: 'stichingCart',
    versionKey: false,
    strict: true
});

exports.stichingCartModel = mongoose.model('stichingCart', stichingCartSchema);
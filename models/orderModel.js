const { mongoose, conn } = require('../config/db');

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    addressId: {
        type: mongoose.Types.ObjectId,
        ref: 'address'
    },
    orderList: [{
        type: mongoose.Types.ObjectId,
        ref: 'orderList'
    }],
    stichingList: [{
        type: mongoose.Types.ObjectId,
        ref: 'stichingCart'
    }],
    offerid:{
        type: mongoose.Types.ObjectId,
        ref:'adminOffer'
    },
    no_of_readyMade: {
        type: Number,
        default: 0
    },
    no_of_stitching: {
        type: Number,
        default: 0
    },
    orderId: {
        type: String,
        default: ""
    },
    skuId: {
        type: String,
        default: ""
    },
    transaction_charge: {
        type: Number,
        default: 0
    },
    delivery_charge: {
        type: Number,
        default: 0
    },
    transactionId: {
        type: String,
        default: ''
    },
    service_charge: {
        type: Number,
        default: 0
    },
    delivery_date: {
        type: Number,
        default: Date.now
    },
    total_price: {
        type: Number,
        required: true
    },
    payment_mode: {
        type: Number,
        default: 0  //0 for cash ,1 for gateway , 2 for wallet 
    },
    status: {
        //0 for ongoing, 1 for approved, 2 for rejected, 3 for completed
        type: Number,
        default: 0
    },

    modified_at: {
        type: Number,
        default: Date.now
    },
    created_at: {
        type: Number,
        default: Date.now
    }
}, {
    collection: 'order',
    versionKey: false,
    strict: true
});

exports.orderModel = mongoose.model('order', orderSchema);
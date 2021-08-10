const { mongoose, conn } = require('../config/db');

const walletSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    transactionId: {
        type: String,
        default: ''
    },
    wallet_type: {
        type: Number,
        default: 0  //0 for add and 1 for subtract
    },
    wallet_dask: {
        type: Number,
        default: 0  //0 means order and 1 means addAmount and 2 means refund 3 means cashback
    },
    created_at: {
        type: Number,
        default: Date.now
    },
    orderId: {
        type: String,
        default: null
    },
    wallet_price: {
        type: Number
    }

},
    {
        strict: true,
        collection: 'wallet',
        versionKey: false
    });

exports.walletModel = mongoose.model('wallet', walletSchema);
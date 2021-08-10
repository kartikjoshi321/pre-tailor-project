const { mongoose, conn } = require('../config/db');

const fabricColorSchema = mongoose.Schema({
    colorName: {
        type: String
    },
    colorCode: {
        type: String
    },
    image:{
        type: String
    },
    quantity:{
        type: Number,
    },
    is_meter: {
        type: Boolean,
        default: false
    },
    meter_price: {
        type: Number,
        default: 0
    },
    is_wars: {
        type: Boolean,
        default: false
    },
    wars_price: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Number,
        default: Date.now()
    },
    isStockReminder:{
        type: Boolean,
        default: false
    },
    qty:{
        type: Number,
        default: 0
    },
    minLimit:{
        type: Number,
        default: 5
    },
    modified_at: {
        type: Number,
        default: Date.now()
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_by:{
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    }
}, {
    collection: 'fabricColor',
    versionKey: false,
    strict: true
});

exports.fabricColorModel = mongoose.model('fabricColor', fabricColorSchema);
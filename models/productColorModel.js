const { mongoose, conn } = require('../config/db');

var sizeSchema = mongoose.Schema({
    size_name: {
        type: String
    },
    qty: {
        type: Number
    },
    price: {
        type: Number
    },
    minLimit: {
        type: Number,
        default: 5
    },
    isStockReminder:{
        type: Boolean,
        default: false
    },
    colorStatus: {
        type: Boolean,
        default: true
    }
});


const productColorSchema = mongoose.Schema({
    colorName: {
        type: String
    },
    colorCode: {
        type: String
    },
    colorImages: [{
        type: String
    }],
    sizeType: {
        // 0 for x sizes and 1 for size numeric
        type: Number,
        default: 1
    },
    units: {
        type: String,
        default: null
    },
    sizes: [sizeSchema],
    created_at: {
        type: Number,
        default: Date.now()
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
    }
}, {
    collection: 'productColor',
    versionKey: false,
    strict: true
});

exports.productColorModel = mongoose.model('productColor', productColorSchema);
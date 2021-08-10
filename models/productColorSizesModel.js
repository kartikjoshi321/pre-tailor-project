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
    colorStatus: {
        type: Boolean,
        default: true
    }
},{
    collection: 'productColorSizes',
    versionKey: false,
    strict: true
});


exports.productColorSizesModel = mongoose.model('productColorSizes', sizeSchema);
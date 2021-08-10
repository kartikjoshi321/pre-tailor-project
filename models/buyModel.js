const {mongoose,conn}= require('../config/db');
const { productColorModel } = require('./productColorModel');

const buySchema = mongoose.Schema({
    userId:{
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    brandId: {
        type: mongoose.Types.ObjectId,
        ref: 'productBrand'
    },
    productId: {
        type: mongoose.Types.ObjectId,
        ref: 'product'    
    },
    tailorId:{
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    color: {
        type: mongoose.Types.ObjectId,
        ref: 'productColor'
    },
    size: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    unit_price:{
        type: Number,
        default: 0
    },
    created_at: {
        type: Number,
        default: Date.now
    }
},{
    collection: 'buy',
    versionKey: false,
    strict: true
}); 

exports.buyModel = mongoose.model('buy',buySchema);
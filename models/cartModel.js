const {mongoose,conn}= require('../config/db');
const { productColorModel } = require('./productColorModel');

const cartSchema = mongoose.Schema({
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
    status: {
        type: Number,
        default: 0 //0 for cart and 1 for save For later
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
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Number,
        default: Date.now
    },
    modified_at: {
        type: Number,
        default: Date.now
    }
},{
    collection: 'cart',
    versionKey: false,
    strict: true
}); 

exports.cartModel = mongoose.model('cart',cartSchema);
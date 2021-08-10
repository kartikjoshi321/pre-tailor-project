const {mongoose,conn}= require('../config/db');

const productSchema = mongoose.Schema({
    name: {
        type:String,
        required: true,
    },
    description: {
        type: String,
        require: true
    },
    image: {
        type: String,
        required: true
    },
    colorOption:[{
        type: mongoose.Types.ObjectId,
        ref: 'productColor'
    }],
    brandId: {
        type: mongoose.Types.ObjectId,
        ref: 'productBrand'
    },
    created_by:{
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    created_at:{
        type: Number,
        default: Date.now
    },
    modified_at: {
        type: Number,
        default: Date.now
    },
    is_active: {
        type: Boolean,
        default: true
    },
    price_start_from: {
        type: Number,
        default: 0
    },
    price_end_by:{
        type: Number,
        default: 0
    },
    reason:{
        type: String,
        default: ''
    },
    rating:{
        type: Number,
        default: 0
    },
    is_approved:{
        type: Number,
        default: 1
        // 1 for pending, 2 for approved, 3 for rejected
    },
    sku_id:{
        type: Number,
        required: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    cancellation: {
        type: Boolean,
        default: true
    },
    return_type: {
        //0 for both 1 for return 2 for replace
        type: Number,
        default: 1
    },
    return_allowed: {
        type: Boolean,
        default: true
    }
},{
    collection: 'product',
    versionKey: false,
    strict: true
}); 

exports.productModel = mongoose.model('product',productSchema);
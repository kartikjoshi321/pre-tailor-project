const {mongoose,conn}= require('../config/db');

const productTypeSchema = mongoose.Schema({
    name: {
        type:String,
        required: true,
    },
    image: {
        type:String
    },
    description: {
        type: String,
        require: true
    },
    categoryId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    }],
    subCategoryId:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subCategory'
    }],
    is_active:{
        type: Boolean,
        default: true
    },
    is_deleted:{
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
    timestamp: true,
    collection: 'productType',
    versionKey: false,
    strict: true
}); 

exports.productTypeModel = mongoose.model('productType',productTypeSchema);
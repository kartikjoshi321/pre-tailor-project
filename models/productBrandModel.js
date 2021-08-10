const {mongoose,conn}= require('../config/db');

const productBrandSchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    image:{
        type: String,
    },
    brand_doc:{
        type:String,
    },
    uploaded_doc_type:{
        //0 for Brand Registration Document 1 for Brand Authorization letter
        type: Number,
        default: 0
    },
    categoryId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    }],
    subCategoryId:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subCategory'
    }],
    productTypeId:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'productType'
    }],
    created_at:{
        type: Number,
        default: Date.now()
    },
    modified_at:{
        type: Number,
        default: Date.now()
    },
    brand_owner:{
        //no for admin
        type: String,
        default: 'no'
    },
    add_by:{
        type: String,
        default: 'tailor'
    },
    ownerId: {
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    status:{
        type: Boolean,
        default: true
    },
    is_approved:{
        type: Number,
        default: 1
        // 1 for pending, 2 for approved, 3 for rejected
    },
    is_deleted:{
        type: Boolean,
        default: false
    },is_active:{
        type: Boolean,
        default: true
    }
},{
    collection: 'productBrand',
    versionKey: false,
    strict: true
}); 

exports.productBrandModel = mongoose.model('productBrand',productBrandSchema);
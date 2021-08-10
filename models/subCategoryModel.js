const {mongoose,conn}= require('../config/db');

const subCategorySchema = mongoose.Schema({
    subCategory_name: {
        type:String,
        required: true,
    },
    subCategoryImage: {
        type:String,
        required: true,
        default: ''
    },
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: 'category'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: String,
        default: new Date().getTime()
    },
    updated_at: {
        type: String,
        default: new Date().getTime()
    }
},{
    timestamp: true,
    collection: 'subCategory',
    versionKey: false,
    strict: true
});

exports.subCategoryModel = mongoose.model('subCategory',subCategorySchema);
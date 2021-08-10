const {mongoose,conn}= require('../config/db');

const categorySchema = mongoose.Schema({
    category_name: {
        type:String,
        required: true,
    },
    image: {
        type:String,
        require: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted:{
        type: Boolean,
        default:false
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
    collection: 'category',
    versionKey: false,
    strict: true
}); 

exports.categoryModel = mongoose.model('category',categorySchema);
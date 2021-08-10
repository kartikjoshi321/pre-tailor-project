const {mongoose,conn}= require('../config/db');

const fabricBrandSchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    fabricTypeId:[{
        type: mongoose.Types.ObjectId,
        ref: 'fabricType'
    }],
    image:{
        type: String
    },
    created_at:{
        type: Number,
        default: Date.now()
    },
    modified_at:{
        type: Number,
        default: Date.now()
    },
    is_active:{
        type: Boolean,
        default: true
    },
    is_deleted:{
        type: Boolean,
        default: false
    }
},{
    collection: 'fabricBrand',
    versionKey: false,
    strict: true
}); 

exports.fabricBrandModel = mongoose.model('fabricBrand',fabricBrandSchema);
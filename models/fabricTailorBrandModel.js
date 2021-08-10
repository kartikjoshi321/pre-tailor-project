const {mongoose,conn}= require('../config/db');

const fabricSchema = mongoose.Schema({
    fabricTypeId: {
        type:mongoose.Types.ObjectId,
        ref:'fabricType'
    },
    created_by:{
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    brandList:[{
        type: mongoose.Types.ObjectId,
        ref: 'fabric'
    }],
    created_at:{
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
},{
    collection: 'fabricTailorBrand',
    versionKey: false,
    strict: true
}); 

exports.fabricTailorBrandModel = mongoose.model('fabricTailorBrand',fabricSchema);
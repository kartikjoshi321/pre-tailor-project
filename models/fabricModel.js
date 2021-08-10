const {mongoose,conn}= require('../config/db');

const fabricSchema = mongoose.Schema({
    fabricTypeId: {
        type:mongoose.Types.ObjectId,
        ref:'fabricType'
    },
    brandId: {
        type: mongoose.Types.ObjectId,
        ref: 'fabricBrand'
    },
    fabricTailorBrandId:{
        type: mongoose.Types.ObjectId,
        ref: 'fabricTailorBrand'
    },
    colorOption:[{
        type: mongoose.Types.ObjectId,
        ref: 'fabricColor'
    }],
    created_by:{
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
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
    collection: 'fabric',
    versionKey: false,
    strict: true
}); 

exports.fabricModel = mongoose.model('fabric',fabricSchema);
const {mongoose,conn}= require('../config/db');

const fabricTypeSchema = mongoose.Schema({
    name: {
        type:String,
        required: true,
    },
    description: {
        type: String,
        require: true
    },
    image:{
        type: String,
    },
    is_active:{
        type: Boolean,
        default: true
    },
    is_deleted:{
        type: Boolean,
        default: false
    },
    created_at:{
        type: Number,
        default: Date.now()
    },
    modified_at:{
        type: Number,
        default: Date.now()
    },
},{
    timestamp: true,
    collection: 'fabricType',
    versionKey: false,
    strict: true
}); 

exports.fabricTypeModel = mongoose.model('fabricType',fabricTypeSchema);
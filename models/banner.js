let { mongoose, conn } = require('../config/db');

const bannerSchema = new mongoose.Schema({
    title:{
        type:String,
        default:null
    },
    bannerImage:{
        type:String,
        default:null
    },
    description:{
        type:String,
        default:null
    },
    orderType:{
        type:String,
        default:null
    },
    discount:{
        type:String,
        default:null
    },
    is_block:{
        type:Boolean,
        default:false
    },
    createdAt:{
        type:Number,
        default:Date.now
    }
},{
    strict: true,
    timestamps: true,
    collection: 'banner',
    versionKey: false
})
exports.bannerModel= mongoose.model('banner', bannerSchema);

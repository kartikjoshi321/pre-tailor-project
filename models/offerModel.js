let { mongoose, conn } = require('../config/db');

const offerSchema = new mongoose.Schema({
    duration:{
        from: Number,
        to: Number
    },
    offer_name:{
        type: String,
        required:true
    },
    offer_type:{
        type: Number,
        default:0   // 0 for spend More Earn More, 1 for free/heavy discount, 2 Give discount .
    },
    offer_code:{
        type: String,
        default:''
    },
    status:{
        type: Number,
        default: 1 // 0 for pending, 1 for approved, 2 for rejected
    },
    categories:[{
        type:mongoose.Types.ObjectId,
        ref:'category'
    }],
    products:[{
        type:mongoose.Types.ObjectId,
        ref:'product'
    }],
    stiching:[{
        type:mongoose.Types.ObjectId,
        ref:'fabricType'
    }],
    order_amount_limit:{
        max:{
            type:Number,
            default: 0
        },min:{
            type:Number,
            default: 0
        }
    },
    onOrder:{
        type: Number,
        default: 0
    },
    maxDiscount:{
        type: Number,
        default: 0
    },
    tailorId:{
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    created_at:{
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
    strict: true,
    collection: 'offer',
    versionKey: false
})
exports.offerModel= mongoose.model('offer', offerSchema);
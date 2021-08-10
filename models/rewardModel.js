
const { mongoose, conn } = require('../config/db');

const rewardSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    reward_point: {
        type: Number,
        default: 0
    },
    reward_type: {
        type: Number,
        default: 0  //0 for add and 1 for subtract
    },
    reward_dask: {
        type: Number,
        default: 0  //0 means refer and 1 means order
    },
    modified_at: {
        type: Number,
        default: Date.now
    },
    created_at: {
        type: Number,
        default: Date.now
    },
    orderId: {
        type: String
    },
    price: {
        type: Number
    },
    refer_by:{
        type:Number,  // 0 for person who invite , 1 for invited person 
        default: 0
    },
    refer_price:{
        type:Number,
        default:0
    },
    payment: {
        type: Boolean,
        default: false
    }

},
    {
        strict: true,
        collection: 'reward',
        versionKey: false
    });

exports.rewardModel = mongoose.model('reward', rewardSchema);
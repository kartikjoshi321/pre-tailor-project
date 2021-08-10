let { mongoose, conn } = require('../config/db');

const rewardPointsSchema = new mongoose.Schema({
    enable: {
        type: Boolean,
        default: false
    },
    partial_payment: {
        type: Boolean,
        default: false
    },
    full_payment: {
        type: Boolean,
        default: false
    },
    point: {
        type: Number,
        default: 0
    },
    value: {
        type: Number,
        default: 0
    },
    referral_point: {
        type: Number,
        default: 0
    },
    order_completion_point: [{
        point: {
            type: Number,
            default: 0
        },
        value: {
            type: Number,
            default: 0
        }
    }],
    created_at: {
        type: Number,
        default: new Date().getTime()
    },
    updated_at: {
        type: Number,
        default: new Date().getTime()
    },
    reward_percentage:{
        type:String,
        default:'10'

    }
},{
    strict: true,
    collection: 'rewardPoints',
    versionKey: false
})
exports.rewardPointsModel= mongoose.model('rewardPoints', rewardPointsSchema);
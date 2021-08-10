const { mongoose, conn } = require('../config/db');

const userCancelResonSchema = mongoose.Schema(
    {
        reason:{
            type: String,
            required: true
        },
        created_at: {
            type: Number,
            default: Date.now
        },
        modified_at: {
            type: Number,
            default: Date.now
        }
    }, {
    collection: 'userCancelReason',
    versionKey: false,
    strict: true
});

exports.userCancelResonModel = mongoose.model('userCancelReson', userCancelResonSchema);
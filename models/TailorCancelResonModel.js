const { mongoose, conn } = require('../config/db');

const tailorCancelResonSchema = mongoose.Schema(
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
    collection: 'tailorCancelReson',
    versionKey: false,
    strict: true
});

exports.tailorCancelResonModel = mongoose.model('tailorCancelReson', tailorCancelResonSchema);
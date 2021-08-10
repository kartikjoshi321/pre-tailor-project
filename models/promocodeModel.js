var { mongoose, conn } = require('../config/db');

const promocodeSchema = new mongoose.Schema({
    start : {
        type: Number,
        default: new Date().getTime()
    },
    end : {
        type: Number,
        default: new Date().getTime()
    },
    title: {
        type: String,
        default: null
    },
    usage_limit: {
        type: Number,
        default: 0
    },
    discount_percentage: {
        type: Number,
        default: 0
    },
    discount_limit: {
        type: Number,
        default: 0
    },
    image: [{
        type: String,
        default: null
    }],
    description: {
        type: String,
        default: null
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_at:{
        type: Number,
        default: new Date().getTime()
    },
    updated_at:{
        type: Number,
        default: new Date().getTime()
    }
},
    {
        strict: true,
        collection: 'promocode',
        versionKey: false
    }
);

exports.promocodeModel = mongoose.model('promocode', promocodeSchema);
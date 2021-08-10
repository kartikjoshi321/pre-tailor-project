const { mongoose, conn } = require('../config/db');

var kunduraSchema = mongoose.Schema({
    name: {
        type: String
    },
    image: {
        type: String,
        default: null

    },
    parameter: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
},
    {
        collection: 'model',
        versionKey: false,
        timestamps: true,
        strict: true
    });


exports.kunduraModel = mongoose.model('model', kunduraSchema);
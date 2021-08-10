var { mongoose, conn } = require('../config/db');

const historySchema = new mongoose.Schema({
    userId : {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    name :{
        type: String,
        require: true
    },
    created_at:{
        type: Number,
        default: Date.now
    }
},
    {
        strict: true,
        collection: 'history',
        versionKey: false
    }
);

exports.historyModel = mongoose.model('history', historySchema);
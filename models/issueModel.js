var { mongoose, conn } = require('../config/db');

const issueSchema = new mongoose.Schema({
    issue_regarding:{
        type: String,
        required: true
    },
    issue_type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    images: [{
        type: String
    }],
    orderId: {
        type: String,
    },
    created_at:{
        type: Number,
        default: Date.now
    },
    status: {
        type: Number,
        default: 0  //0 for active status,1 for open status,2 for close status
    },
    created_by:{
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    active_status:{
        status:{
            type: Boolean,
            default: false
        },
        created_on:{
            type: Number
        }
    },
    open_status:{
        status:{
            type: Boolean,
            default: false
        },
        created_on:{
            type: Number
        }
    },
    close_status:{
        status:{
            type: Boolean,
            default: false
        },
        created_on:{
            type: Number
        }
    }
},
    {
        strict: true,
        collection: 'issue',
        versionKey: false
    }
);

exports.issueModel = mongoose.model('issue', issueSchema);
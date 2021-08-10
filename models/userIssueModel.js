const { mongoose, conn } = require('../config/db');

const userissueSchema = mongoose.Schema(
    {
        issue:{
            type: String,
            
        },
        issue_type:{
            type: String,
            
        },
        description:{
            type: String,
            
        },
        image:{
            type: String,
            
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
    collection: 'userIssue',
    versionKey: false,
    strict: true
});

exports.userissueModel = mongoose.model('userissue', userissueSchema);
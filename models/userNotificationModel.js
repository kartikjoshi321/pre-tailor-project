var { mongoose, conn } = require('../config/db');

const userNotificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: null  
    },
    title: {
        type: String,
        default: ''   
    },
    body: {
        type: String,
        default: ''   
    },
    type: {
        type: String,
        default: ''   
    },
    created_at:{
        type: String,
        default: Date.now()
    }
},
    {
        strict: true,
        collection: 'userNotification',
        versionKey: false
    }
);

exports.userNotificationModel = mongoose.model('userNotification', userNotificationSchema);


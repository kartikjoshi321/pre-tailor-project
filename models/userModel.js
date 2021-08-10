var { mongoose, conn } = require('../config/db');

const userSchema = new mongoose.Schema({
    roleId: {
        type: Number,
        default: 2  //Note: RoleId 1 for admin, 2 for user, 3 for taylor
    },
    email: {
        type: String,
        default: null
    },
    profileImage: {
        type: String,
        default: ''
    },
    username: {
        type: String,
        default: ''
    },
    mobile: {
        type: String,
        default: null
    },
    countryCode: {
        type: String,
        default: null
    },

    isOtpVerified: {
        type: Boolean,
        default: false,
    },
    addresses:[{
        type: mongoose.Types.ObjectId,
        ref: 'address'
    }],
    deviceType: {
        type: Number,
        default: 0
    },              // 0 for Android, 1 for IOS
    deviceToken: {
        type: String,
        default: null
    },              
    password: {
        type: String,
        default: null
    },
    socialId: {
        type: String,
        default: null
    },
    isBlocked: {
        type: Number,
        default: 0,
    },
    otpInfo: {
        otp: String,
        expTime: Date  //otp expiry time
    }, token: {
        type: String,
        default: ''
    },
    referralId: {
        type: String,
        require: true
    },

    referralIdFrom: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    notification: {
        type: Boolean,
        default: false
    },
    created_at:{
        type: Number,
        default: Date.now()
    },
    modified_at:{
        type: Number,
        default: Date.now()
    }
},
    {
        strict: true,
        collection: 'user',
        versionKey: false
    }
);

exports.UserModel = mongoose.model('user', userSchema);


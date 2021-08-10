var { mongoose, conn } = require('../config/db');

const tailorSchema = new mongoose.Schema({
    roleId: {
        type: Number,
        default: 0  //Note: RoleId 1 for admin, 2 for user, 3 for taylor
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default:''
    },
    mobile: { 
        type: String,
        default:''
    },
    country:{
        type: String,
        default: ''
    },
    countryCode: { 
        type: String,
        default:''
    },
    dob: {
        type: Number,
        default:''
    },
    isOtpVerified: {
        type: Boolean,
        default:false,
      },
    
    deviceType: {
        type: Number,
        default:0
    },              // 0 for Android, 1 for IOS
    deviceToken: {
        type: String,
        default: null
    }, 
    password:{
        type: String,
        default:null
    },
    isBlocked: {
        //0 for non blocked, 1 for blocked
        type: Number,
        default: 0,
    },
    socialId:{
        type: String,
        default: null
    },
    otpInfo: {
      otp: String,
      expTime: Date  //otp expiry time
    },
    token: {
        type: String,
        default: ''
    },
    page_status: {
        // 0 for no page 1 for first page completed 2 for 2nd and so on to 5 and 6 when all pages completed.
        type: Number,
        default: 0
    },
    tailor_profile_Id: {
        type: mongoose.Types.ObjectId,
        ref: 'tailorProfile'
    },
    notification: {
        type: Boolean,
        default: false
    },
    // location : {
    //     type: {
    //         type: String,
    //         default: 'Point'
    //     },
    //     coordinates: [Number] 
    // },
    Longitude : {
        type: String,
        default: "N/A"
    },
    Latitude : {
        type:  String,
        default : "N/A"
    },
    referralId: {
        type: String,
        require: true
    },

    referralIdFrom: {
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    is_profile_completed:{
        // false , true
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
    },
    username:{
        type: String,
        default: ''
    }
},
    {
        strict: true,
        collection: 'tailor',
        versionKey: false
    }
);

exports.TailorModel = mongoose.model('tailor', tailorSchema);

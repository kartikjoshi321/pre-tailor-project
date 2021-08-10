let { mongoose, conn } = require('../config/db');
require('mongoose-double')(mongoose);
var Double = mongoose.Schema.Types.Double;
const ustaadSchema = new mongoose.Schema(
    {   roleId:{
        type:Number,
        default:2
    },
        email: {
            type: String,
            default: null
        },

        userName: {
            type: String,
            default: null

        },
        generated_user_id: {
            type: String,
            default: null
        },
        generated_password: {
            type: String,
            default: null
        },
        country: {
            type: mongoose.Types.ObjectId,
            ref: 'countries'
        },
        role: {
            type: String,
            default: ''
        },
        mobile: {
            type: Number,
            required: true
        },
        region: {
            type: String,
        },
        is_deleted:{
            type: Boolean,
            default: false
        },
        token: {
            type: String,
            default: null
        },

        is_active:{
            type: Boolean,
            default: true
        },

        is_User_Mgmt: {
            type: Boolean,
            default: false
        },
        is_geoLocation_mgmt: {
            type: Boolean,
            default: false
        },

        is_dashboard: {
            type: Boolean,
            default: false
        },
        is_Tailor_Mgmt: {
            type: Boolean,
            default: false
        },
        is_Orders_Mgmt: {
            type: Boolean,
            default: false
        },
        is_Product_Category_Mgmt: {
            type: Boolean,
            default: false
        },
        is_notifications_mgmt: {
            type: Boolean,
            default: false
        },
        is_user_mgmt: {
            type: Boolean,
            default: false
        },
        is_Promotions_Mgmt: {
            type: Boolean,
            default: false
        },
        is_fabric_type_Mgmt: {
            type: Boolean,
            default: false
        },
        is_rating_review_Mgmt: {
            type: Boolean,
            default: false
        },
        is_Refund_Mgmt: {
            type: Boolean,
            default: false
        },
        is_Charges_Mgmt: {
            type: Boolean,
            default: false
        },
        is_Revenue_Mgmt: {
            type: Boolean,
            default: false
        },
        is_CMS_Mgmt: {
            type: Boolean,
            default: false
        },
        is_reportGeneration_mgmt: {
            type: Boolean,
            default: false
        },
        is_setting_mgmt: {
            type: Boolean,
            default: false
        },
        // is_Timeslot_mgmt: {
        //     type: Boolean,
        //     default: false
        // },
        is_support_mgmt: {
            type: Boolean,
            default: false
        },
        is_payments_mgmt: {
            type: Boolean,
            default: false
        },

        clientAdminID: {
            type: String,
            default: false
        },
        userName: {
            type: String,
            default: false
        },
        // country: {
        //     type: String,
        //     default: null
        // },
        region: {
            type: String,
            default: false
        },
        profileImage: {
            type: String,
            default: "https://s3hootimages.s3.me-south-1.amazonaws.com/1611148258973/fedx.jpeg"
        },

        requestedEmail: { //Use during email change
            type: String,
            default: false
        },
        requestedContactNumber: { //Use during mobile number change
            type: Number,
            default: false
        },
        requestedCountryCode: {
            type: String,
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
    },
    {
        strict: true,
        collection: 'ustaad',
        versionKey: false
    }
);

exports.ustaadModel = mongoose.model('ustaad', ustaadSchema);
let { mongoose,conn } = require('../config/db');
require('mongoose-double')(mongoose);
var Double = mongoose.Schema.Types.Double;

let tailorProfileSchema = mongoose.Schema({
    businessType:{
        // 0 for stitching, 1 for Ready made , 2 for both
        type: Number,
        required:true
    },
    created_at:{
        type: Number,
        default: Date.now()
    },
    avrg_rating : {
        type: Number,
        default: 4.2
    },
    modified_at:{
        type: Number,
        default: Date.now()
    },
    tailorId: {
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    fullName: {
        type: String,
        default: ''
    },
    experience:{
        type: String,
        default: ''
    },
    profile_status:{
        // 0 for pending, 1 for approved ,2 for rejected
        type: Number,
        default: 0
    },
    is_profile_filled:{
        type: Boolean,
        default:false
    },
    is_deleted:{
        type: Boolean,
        default:false
    },
    is_block:{
        type: Boolean,
        default:false
    },
    price_start_from:{
        type: Number
    },
    price_end_by:{
        type: Number
    },
    nationalIdImage:[{
        type: String
    }],
    passportImage:[{
        type: String
    }],
    image:{
        type: String,
        default: ''
    },
    businessLocation:{
        building_number:{
            type: String,
            default: ''
        },
        street_name: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ''
        },
        country: {
            type: String,
            default: ''
        },
        postal_code: {
            type: String,
            default: ''
        },
        latitude: {
            type: Double,
            default: ''
        },
        longitude: {
            type: Double,
            default: ''
        }
    },
    businessDetails:{
        trading_license_image: {
            type: String,
            default: ''
        },
        tax_id_image: {
            type: String,
            default: ''
        },
        signature_image: {
            type: String,
            default: ''
        },
        working_days:[{
            type: String
        }],
        working_hours:[{
            opening_time:{
                type:String,
                default: ''
            },
            closing_time:{
                type:String,
                default: ''
            }
        }],
        charges:{
            charge_for_kid:{
                type:Number,
                default: 0
            },
            charge_for_adult:{
                type:Number,
                default: 0
            }
        },
        images:[{
            type:String,
        }]

    },
    storeDetails:{
        display_name:{
            type:String,
            default:''
        },
        business_logo_image:{
            type:String,
            default:''
        },
        store_description:{
            type:String,
            default: ''
        }
    },
    bank_details:{
        account_type:{
            //0 for IBAN and 1 for Account
            type:Number,
            default: 0
        },
        account_number:{
            type:String,
            default: ''
        },
        account_name:{
            type:String,
            default: ''
        },
        bank_name:{
            type:String,
            default: ''
        },
        country:{
            type:String,
            default: ''
        },
        branch_address:{
            building_number:{
                type:String,
                default: ''
            },
            street_name:{
                type:String,
                default: ''
            },
            city:{
                type:String,
                default: ''
            },
            branch_address_country:{
                type:String,
                default: ''
            },
            postal_code:{
                type:String,
                default: ''
            }
        }

    }
},{
    collection: 'tailorProfile',
    versionKey: false,
    strict: true
});

exports.tailorProfileModel = mongoose.model('tailorProfile',tailorProfileSchema);
let {
    mongoose,
    conn
} = require('../config/db');

const countrySchema = new mongoose.Schema({
    countryName: {
        type: String,
    },
    // cityAllocatedToThisCountry: [{
    //     type: mongoose.Types.ObjectId,
    //     ref: 'cities'
    // }],
    // currency: {
    //     type: String,
    // },
    applicableTaxes: [{
        type: String,
        default: ''
    }],
    countryFlag: {
        type: String
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Number,
        default: new Date().getTime()
    },
    modified_at: {
        type: Number,
        default: new Date().getTime()
    }
}, {
    strict: true,
    timestamps: true,
    collection: 'countries',
    versionKey: false
})
exports.countryModel = mongoose.model('countries', countrySchema);
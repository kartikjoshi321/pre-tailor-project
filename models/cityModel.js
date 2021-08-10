let { mongoose, conn } = require('../config/db');

const citySchema = new mongoose.Schema({
    cityName:{
        type:String,
        default:null
    },
    country: {
        type: mongoose.Types.ObjectId,
        ref: 'countries',
        default: null
    },
    is_active:{
        type: Boolean,
        default: true
    },
    is_deleted:{
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
},{
    strict: true,
    timestamps: true,
    collection: 'cities',
    versionKey: false
})
exports.cityModel= mongoose.model('cities', citySchema);

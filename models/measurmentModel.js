const {mongoose,conn}= require('../config/db');

const measurmentSchema = mongoose.Schema({
    memberId:{
        type: String,
        required: true
    },
    userId:{
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    recordMeasurementId:{
        type: mongoose.Types.ObjectId,
        ref: 'recordmeasurment'
    },
    // type: mongoose.Types.ObjectId,
    //     ref: 'fabric'
    fabricSample:[{
        type: String
    }],
    is_request_samples:{
        type: Boolean,
        default: false
    },
    measurementDate:{
        type: Number,
    },
    measurementTime: {
        type: String,
    },
    created_at: {
        type: Number,
        default: Date.now
    },
    modified_at: {
        type: Number,
        default: Date.now
    },
    ustaadId:{
        type: mongoose.Types.ObjectId,
        ref: "ustaad"
    }
},{
    collection: 'measurment',
    versionKey: false,
    strict: true
}); 

exports.measurmentModel = mongoose.model('measurment',measurmentSchema);
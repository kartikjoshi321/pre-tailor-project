const { mongoose, conn } = require('../config/db');

const recordmeasurmentSchema = mongoose.Schema({
    fabricId: {
        type: mongoose.Types.ObjectId,
        ref: 'fabricType'
    },
    measurmentId:{
        type: mongoose.Types.ObjectId,
        ref: 'measurment'
    },
    modelId:{
        type: mongoose.Types.ObjectId,
        ref: 'model'
    },
    stichingId:{
        type: mongoose.Types.ObjectId,
        ref: 'stichingCart'
    },
    ustaadId :{
        type: mongoose.Types.ObjectId,
        required:true
    },
    userId :{
        type: mongoose.Types.ObjectId,
        required:true
    }, 
    comments:{
        type: String,
        default: ""
    },
    parameters:[{

        name:String,
        value:String
    }],
    fabricSize:{
        type: String,
        required: true
    },
    created_at: {
        type: Number,
        default: Date.now
    },
    modified_at: {
        type: Number,
        default: Date.now
    },

},
    {
    collection: 'recordmeasurment',
    versionKey: false,
    strict: true
});

exports.recordMeasurementModel = mongoose.model('recordmeasurment', recordmeasurmentSchema);

// modelId,parameters,comment,userId,ustaadId,created_by,modified_at




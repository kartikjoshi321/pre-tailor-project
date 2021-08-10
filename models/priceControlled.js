const {mongoose,conn}= require('../config/db');

const priceControlledSchema = mongoose.Schema({
    duration:{
        type:String,
        require:true
    },
    price:{
        type:String,
        require:true
    },
    created_at: {
        type: Number,
        default: Date.now()
    }
},{
    collection: 'priceControlled',
    versionKey: false,
    strict: true
}); 

exports.priceControlledModel = mongoose.model('priceControlled',priceControlledSchema);
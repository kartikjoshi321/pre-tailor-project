
const { mongoose, conn } = require('../config/db');

const ratingSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    
    tailorId: {
        type: mongoose.Types.ObjectId,
        ref: 'tailor'
    },
    // productId: {
    //     type: mongoose.Types.ObjectId,
    //     ref: 'product'
    // },
    stichingId: {
        type: mongoose.Types.ObjectId,
        ref: 'stichingCart'
    },
    orderId:{
        type: mongoose.Types.ObjectId,
        ref:'order'


    },
    ratingpoint: {
        type: Number
    },
    review: {
        type: String
    },
    image:{
        type:String,
        default:' '
    },
    improvement:{
        type:String
    },
    modelname:{
        type:String,
    },
    modified_at: {
        type: Number,
        default: Date.now
    },
    created_at: {
        type: Number,
        default: Date.now
    }

},
    {
        strict: true,
        collection: 'rating',
        versionKey: false
    });

exports.ratingModel = mongoose.model('rating', ratingSchema);
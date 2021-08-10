var { mongoose, conn } = require('../config/db');

const wishlistTailorSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    tailorId :{
        type: mongoose.Types.ObjectId,
        ref: 'tailorProfile',
        require: true
    },
    created_at:{
        type: Number,
        default: Date.now
    }
},
    {
        strict: true,
        collection: 'wishlistTailor',
        versionKey: false
    }
);

exports.wishlistTailorModel = mongoose.model('wishlistTailor', wishlistTailorSchema);
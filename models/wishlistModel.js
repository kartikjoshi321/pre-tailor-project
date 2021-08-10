var { mongoose, conn } = require('../config/db');

const wishlistSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    productId :{
        type: mongoose.Types.ObjectId,
        ref: 'product',
        require: true
    },
    created_at:{
        type: Number,
        default: Date.now
    }
},
    {
        strict: true,
        collection: 'wishlist',
        versionKey: false
    }
);

exports.wishlistModel = mongoose.model('wishlist', wishlistSchema);
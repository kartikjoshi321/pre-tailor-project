const { mongoose, conn } = require("../config/db");

const commissionSchema = new mongoose.Schema({
    city:{
        type: mongoose.Types.ObjectId,
        ref: 'cities'
    },
    commission:{
        type: Number,
        default: 0
    }
},{
    strict: true,
    timestamp: true,
    versionKey: false,
    collection: "commission"
});

exports.commissionModel = mongoose.model('commission',commissionSchema);
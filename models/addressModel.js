var { mongoose, conn } = require('../config/db');
require('mongoose-double')(mongoose);
var Double = mongoose.Schema.Types.Double;

const addressSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  house_number: {
    type: String,
    default: ''
  },
  building_number: {
    type: String,
    default: ''
  },
  landmark: {
    type: String,
    default: ''
  },
  location_type: {
    type: String,
    default: 'Other'
  },
  Longitude : {
    type: Double,
    default: "N/A"
  },
  Latitude : {
    type:  Double,
    default : "N/A"
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'user'
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
},
  {
    strict: true,
    collection: 'address',
    versionKey: false
  }
);

exports.AddressModel = mongoose.model('address', addressSchema);
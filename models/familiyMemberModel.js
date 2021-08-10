const { mongoose,conn}= require('../config/db');

const familiyMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    member_is:{
        //0 for kid and 1 for adult
        type:Number,
        default: 1
    },
    memberImage: {
        type: String,
        default: null
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
    collection: 'familyMember',
    versionKey: false,
    timestamps: true
});

exports.FamilyMemberModel = mongoose.model('familyMember',familiyMemberSchema);


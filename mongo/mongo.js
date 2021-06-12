const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({

    email:
    {
        type:String,
        required: true
    },
    password:
    {
        type:String,
        required: true
    },
    sms:{
        type: Boolean,
        default: false
    },
    phone:
    {
        type: Number
    }
    
},
{
    timestamps: true,
    autoCreate: true

} 
);

const User = mongoose.model('User', UserSchema);

module.exports = User;
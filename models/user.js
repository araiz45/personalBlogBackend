const mongoose = require("mongoose")
const { Schema, model } = mongoose;

const userSchema = new Schema ({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
        minlength: 3,
    }

})

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
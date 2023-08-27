const mongoose = require('mongoose')
const {Schema, model} = mongoose;


const PostSchema = new Schema({
    title: String,
    summary: String,
    content: String,
    cover: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: true,
})


const postModel = mongoose.model('post', PostSchema);

module.exports = postModel;
const express = require('express')
const cors = require('cors')
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs')
const userModel = require('./models/user')
const app = express()
var cookieParser = require('cookie-parser')
var jwt = require('jsonwebtoken');
const port = 4000;
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs')
const postModel = require("./models/post");
// const { timeStamp } = require('console');
const privateKey = 'slfjsdlfja;';
mongoose.connect('mongodb://127.0.0.1:27017/pblog').then(() => {
    console.log('connected')
})
const salt = bcrypt.genSaltSync(10);
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads/'))

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (password.length > 3) {
        const findUser = await userModel.find({ username }).exec()
        if (findUser.length === 0) {
            const hashPassword = bcrypt.hashSync(password, salt);
            const userDoc = new userModel({ username, password: hashPassword });
            await userDoc.save();
            return res.json({ message: 'User created successfully' })
        } else {
            return res.status(400).json({ message: 'User already exists' })
        }

    } else {
        return res.status(400).json({ message: 'Invalid username or password' });
    }
})

app.post("/login", async (req, res) => {
    const { username, password } = req.body

    const findUser = await userModel.findOne({ username }).exec();
    if (findUser === null) {
        return res.status(400).json({ message: 'no user found' })
    } else {
        const passOk = bcrypt.compareSync(password, findUser.password);
        // return res.json(passOk)
        if (passOk) {
            jwt.sign({ username, id: findUser._id }, privateKey, {}, function (err, token) {
                if (err) throw err
                // res.cookie('hello', 'world').json(req.cookies)
                res.cookie('token', token).json({
                    username,
                    id: findUser._id
                })
                // res.json(token)
            });
        } else {
            return res.status(400).json({ message: 'password is incorrect' })
        }
    }


})

app.get("/profile", (req, res) => {
    const { token } = req.cookies
    if (token.length > 0) {
        jwt.verify(token, privateKey, function (err, decode) {
            if (err) throw err
            return res.json(decode)
        })
    } else {
        return res.status(400).json({ message: 'your are not login' })
    }

})

app.post('/logout', (req, res) => {
    res.cookie('token', '').json(req.cookies)
})


app.post('/post', upload.single('file'), async (req, res) => {
    if (req.file !== undefined) {
        const { originalname, path } = req.file;
        let pathName = originalname.split('.');
        let ext = pathName[pathName.length - 1]
        const newPath = path + '.' + ext
        fs.renameSync(path, newPath)
        const { token } = req.cookies
        jwt.verify(token, privateKey, async function (err, decode) {
            const { title, summary, content } = req.body;
            const newPost = new postModel({
                title,
                summary,
                content,
                cover: newPath,
                author: decode.id
            })
            await newPost.save().then(() => {
                res.json("done")
            })
        })

    }else{
        res.status(400).json({message: 'plesase upload file'})
    }

    // res.json('okay')
})

app.get("/post", async (req, res) => {
    const fetchAll = await postModel.find({}).sort({createdAt: 'desc'})
    // console.log(fetchAll)
    res.json(fetchAll)
})

app.get("/post/:id", async (req, res) => {
    const { id } = req.params;
    const fetchPost = await postModel.findById(id).populate('author', ['username'])
    res.json(fetchPost);
})


app.put("/post/:id", upload.single('file'),async (req, res) =>{
    const {id} = req.params;
    if (req.file !== undefined) {
        const { originalname, path } = req.file;
        let pathName = originalname.split('.');
        let ext = pathName[pathName.length - 1]
        const newPath = path + '.' + ext
        fs.renameSync(path, newPath)
        const { token } = req.cookies
        jwt.verify(token, privateKey, async function (err, decode) {
            const { title, summary, content } = req.body;
            await postModel.findByIdAndUpdate(id, {title, summary, content, cover: newPath, author: decode.id})
            res.json("done")
        })

    }else{
        res.status(400).json({message: 'plesase upload file'})
    }

})


app.delete("/post/:id", async (req, res) =>{
    const {id} = req.params;
    await postModel.findByIdAndDelete(id);
    res.json('done')
})

app.listen(port, () => console.log(`Server listening on port ${port}!`))
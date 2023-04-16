const express = require("express")
const uuid = require("uuid")
const {MongoClient, ServerApiVersion} = require("mongodb")
const nodemailer = require("nodemailer")
require("dotenv").config()


const port = process.env.PORT
const mongoUserName = process.env.MONGODBUSERNAME
const mongoPassword = process.env.MONGODBPASS
const mongoDBDBName = process.env.MONGODBDBNAME
const mongoDBCol = process.env.MONGODBCOL
const mongoLink = process.env.MONGODBLINK

const app = express()
const mongoURI = `mongodb+srv://${mongoUserName}:${mongoPassword}@${mongoLink}/?retryWrites=true&w=majority`
const validateEmailAddress = /[a-z0-9]+[@][a-z0-9]+[.][a-z]{2,18}$/igm

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const client = new MongoClient(mongoURI, {
    serverApi : {
        version : ServerApiVersion.v1,
        strict : true,
        deprecationErrors : true
    }
})

async function create(validMail, Message) {
    try {
        await client.connect()
        const database = client.db(mongoDBDBName)
        const col = database.collection(mongoDBCol)
        const currentTime = new Date()
        const fixedDate = `${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}-${currentTime.getHours()}-${currentTime.getMinutes()}-${currentTime.getSeconds()}`
        const data = {
            "uuid" : uuid.v4(),
            "time" : fixedDate,
            "e-mail" : validMail,
            "message" : Message
        }
        await col.insertOne(data)
    }
    finally {
        await client.close()
    }
}

function sendNotificationEmail(mail, message) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure : false,
        auth: {
            user: process.env.EMAILLOGIN,
            pass: process.env.EMAILPASSWORD
        }
    });
    let mailOptions = {
        from: mail,
        to: process.env.RECEIVINGEMAIL,
        subject: `new message from ${mail} sent with your api`,
        text: message
    }
    transporter.sendMail(mailOptions, function(error, info) {
        if(error) {
            console.log(error)
        }
    })
}

app.get("/health", (req, res) => {
    res.json("health check successfull").status(200).send
})


app.post("/new", (req, res) => {
    if(req.body.email && req.body.message && validateEmailAddress.test(req.body.email)) {
        create(req.body.email, req.body.message)
        sendNotificationEmail(req.body.email, req.body.message)
        res.redirect("https://thebaum123.github.io/#2")
    } else {
        res.status(400)
        if(!req.body.email && !req.body.message) {
            res.json({missing_querys : ["email", "message"]})
        } else if(!req.body.email && req.body.message) {
            res.json({missing_querys : ["email"]})
        } else if(req.body.email && !req.body.message) {
            res.json({missing_querys : ["message"]})
        } else if(validateEmailAddress.test(req.body.email)) {
            res.status(500)
        }
        if(validateEmailAddress.test(!req.body.email)) {
            res.json([wrong_querys] = "email")
        }
    }
    res.send
})

app.get("*", (req, res) => {
    res.sendStatus(404)
})


console.log(`listening on port ${port}`)
app.listen(port)
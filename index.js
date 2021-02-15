const firebase = require("firebase")
const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyD4MjAY3PHlyM-PFamEgzTPdZfSSHNVLA8",
    authDomain: "recipes-backend-46c08.firebaseapp.com",
    projectId: "recipes-backend-46c08",
    storageBucket: "recipes-backend-46c08.appspot.com",
    messagingSenderId: "582888779214",
    appId: "1:582888779214:web:8e4e6aaae4d61c3e05cf9f"
})

const cors = require('cors')
const express = require('express')
const app = express()
const port = process.env.PORT || 4999

const bodyParser = require('body-parser')
// const { firestore } = require("./firebase.utils")

const jwt = require('jsonwebtoken')

app.use(cors())

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

//VERIFY JWT TOKEN
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization']

    // console.log(33,bearerHeader)

    if(bearerHeader) {
        const bearer = bearerHeader.split(" ")
        const bearerToken = bearer[1]

        req.token = bearerToken;
        next();
    } else {
        
        res.json({
            message: "Unauthorized",
            data: []
        })
    }
}


//LOGIN
app.post('/api/login', async (req,res) => {
    let {email, password} = req.body

    let output = {
        email: '',
        password: ''
    }

    let reference = await firebaseApp.firestore().collection('user-management').where('email','==',email).get()

    reference.forEach(item => {
        // console.log(item.data())
        output['email'] = item.data().email
        output['password'] = item.data().password
    })

    if(email===output.email && password===output.password) {
        jwt.sign({email}, 'secretkey', (err, token) => {
            res.json({
                token,
                message: 'authenticated'
            })
        })
    } else {
        res.json({
            token: "",
            message: "unauthorized"
        })
    }

    // res.json(output)

}) 

//ADD A USER
app.post('/api/addAUser', verifyToken , (req,res) => {
    jwt.verify(req.token, 'secretkey', async(err, authData) => {
        if(err) {
            // console.log(req.token)
            // console.log(90,err)
            res.json({
                message: 'Unauthorized',
                data: []
            })
        } else {

            let {username, mobileNumber, email} = req.body

            //Validations
            function validateUserData (username, mobileNumber, email) {

                // let message;

                let faultyInputs = []

                let usernameRegex = /^[A-Za-z0-9 ]+$/
                let emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

                mobileNumber = String(mobileNumber)

                // console.log(45,mobileNumber, mobileNumber.length, email, username)

                if(mobileNumber.length !== 10) {
                    faultyInputs.push('mobilenumber')
                }

                if(username.includes(" ") || !(usernameRegex.test(username))) {
                    faultyInputs.push('username')
                }

                if(!(emailRegex.test(email))) {
                    faultyInputs.push('email')
                }

                return faultyInputs
            }

            let validatedInput = validateUserData(username, mobileNumber, email)
            

            if(validatedInput.length === 0) {
                let output = {
                    username: '',
                    // mobileNumber: '',
                    email: ''
                }
            
                let uniqueId = new Date().getTime()
            
                let usernameReference = await firebaseApp.firestore().collection('allUsers-usrmgmt').where('username','==',username).get()
                let emailReference = await firebaseApp.firestore().collection('allUsers-usrmgmt').where('email','==',email).get()
            
                usernameReference.forEach(item => {
                    if(item.data()) {
                        output.username = item.data().username
                    }
                })

                emailReference.forEach(item => {
                    if(item.data()) {
                        output.email = item.data().email
                    }
                })
                
                // console.log(145, output.email, email, output.username, username)

                if((output.email !== email) && (output.username !== username)) {
                    await firebaseApp.firestore().collection('allUsers-usrmgmt').doc(email).set({
                        email,
                        username,
                        mobileNumber,
                        uniqueId
                    })
                    res.json({
                        authData,
                        message: 'successfully added the user'
                    })
                } else {
                    res.json({
                        message: 'username/email already exists'
                    })
                }
            } else {
                res.json({
                    message: 'error in inputs',
                    validatedInput
                })
            }
        }
    })
            
})

//GET ALL USER DATA
app.get('/api/getAllUserData', verifyToken, (req,res) => {
    jwt.verify(req.token, 'secretkey', async(err, authData) => {
        if(err) {
            // console.log(184,err)
            res.json({
                message: 'Unauthorized',
                data: []
            })
        } else {

            let allData = []

            let reference = await firebaseApp.firestore().collection('allUsers-usrmgmt').get()
            reference.forEach(item => {
                allData.push(item.data())
            })

            res.json({
                message: 'authorized',
                allData
            })
        }
    })
})

//DELETE A PARTICULAR ITEM
app.post('/api/deleteUserData', verifyToken, (req,res) => {
    jwt.verify(req.token, 'secretkey', async(err, authData) => {
        // console.log(214, req.token, req.body)
        if(err) {
            res.json({
                message: 'Unauthorized',
                data: []
            })
        } else {
            let {itemToBeDeleted} = req.body

            await firebaseApp.firestore().collection('allUsers-usrmgmt').doc(itemToBeDeleted).delete()

            res.json({
                message: 'successfully deleted the user info'
            })
        }
    })
})



app.listen(port, () => {
    console.log("Connection established, app listening to ",port)
})
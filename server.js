const mysql = require('mysql')
const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const app = express()
var path = require('path');
var session = require ('express-session')


app.set('trust proxy', 1)

app.use(session({
    secret: 'mysecretNWarrio',
    resave: false,
    saveUninitialized: true,
    cookie: { secure:true}
}))

//connect to the database
const connection = mysql.createConnection({

    host:"localhost",
    user:"root",
    database:"nodejs"
})

connection.connect(function(error){
    if(error) throw error
    else console.log("Connected succesfuly")
})

//middleware

// parse requests of content-type - application/json
app.use(bodyParser.json());


// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
//Set the path to static sources (css,js files)
app.use('/',express.static(path.join(__dirname,'./app/public')));


app.use(express.json())


// //set view engine to ejs
// app.set('views', path.join(__dirname,'/app/views'));



//name the methods-routes you are going to use
app.get('/',function(req,res){
    res.sendFile(__dirname+"/index.html");
})

app.post('/',(req,res,next) =>{
    if(res.locals.user_name== null){

    }
    const user_name = req.body.user_name
    console.log(user_name)
    console.log(req.body.user_name)
   // console.log(req.body)
    connection.query("select * from loginuser where user_name='"+user_name+"' ",function(error,results,fields){
        if(results[0].user_pass){
            bcrypt.compare(req.body.user_pass,results[0].user_pass,function(err,result){
                console.log('>>>>>> ', req.body.user_pass)
                console.log('>>>>>> ', results[0].user_pass)
            if(result) {
                 res.locals.user_name = user_name;
                 res.locals.user_pass = req.body.user_pass
                 if (req.session.views) {
                    req.session.views++
                    res.setHeader('Content-Type', 'text/html')
                    res.write('<p>views: ' + req.session.views + '</p>')
                    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
                    console.log(res.locals)
                    res.redirect('/welcome')
                    res.end()
                    
                  } else {
                    req.session.views = 1
                    res.end('welcome to the session demo. refresh!')
                  }

                 
            }
            else {
             return res.status(400).send('User not found').redirect('/')
            }
            })
        }
    })
})
        

//when login is succesful

app.get("/welcome",function(req,res){
  
     if(req.sessionID != null){
     res.sendFile(__dirname + "/welcome.html")
     }
     else
     res.redirect('/')
})

//get all users to check
app.get('/users', (req, res) => {
    var r = (connection.query('select * from loginuser'),function(result){
        console.log('Data : '+ result)
    })
   
    res.send('Comple')  
})
//create a user in the database with post
app.post('/users', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.user_pass, 10)
    
    var user_name = req.body.user_name
    // console.log(user_name)
    connection.query("insert into loginuser(user_name, user_pass) values('"+user_name+"','"+hashedPassword+"')")
   
    res.status(201).send()
  } catch {
    res.status(500).send()
  }
})

app.post('/users/login', (req, res) => {

  const user_name = req.body.user_name
    connection.query("select * from loginuser where user_name='"+user_name+"' ",function(error,results,fields){
        if(results[0].user_pass){
            bcrypt.compare(req.body.user_pass,results[0].user_pass,function(err,result){
                console.log('>>>>>> ', req.body.user_pass)
                console.log('>>>>>> ', results[0].user_pass)
            if(result) {
                return res.send('Success')
            }
            else {
             return res.status(400).send('User not found')
            }
            })
        }
    })
})




//define port to use for localhost
const PORT = process.env.PORT || 5000;




app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
  })
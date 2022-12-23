var favicon = require('serve-favicon')
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
var path = require('path');
app.set('view-engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

const url = require('url')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose() //verbose provides more detailed stack trace
// const db = new sqlite3.Database('data/users')
const db = new sqlite3.Database('data/users', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the "Users" SQlite database.');
});

module.exports = db


var curruser = require('./passport-config');

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)
var users = []

app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use(methodOverride('source'))

// app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')))


app.use("/public/images", express.static(path.join(__dirname, "public/images")));

//check path..
// console.log(path.join(__dirname, "public/images")) 
 
const apiKey = '51db0096e088f0d2a5046362483132ca';
const apiBaseUrl = 'http://api.themoviedb.org/3';
const nowPlayingUrl = `${apiBaseUrl}/movie/now_playing?api_key=${apiKey}`;
const imageBaseUrl = 'http://image.tmdb.org/t/p/w300';
const request = require('request');


app.use((req, res, next)=>{
  res.locals.imageBaseUrl = imageBaseUrl;
  next()
})


app.get('/', checkAuthenticated, (req, res) => {
   
  curruserid_server = req.session.passport.user;

  request.get(nowPlayingUrl,(error, response, movieData)=>{
    const parsedData = JSON.parse(movieData)
    res.render('index.ejs',{ name: req.user.email,
      parsedData: parsedData.results,
    })
  })
})

app.post('/search', checkAuthenticated, (req, res, next) => {

  const searchquery = encodeURI(req.body.searchstring);

  //catch if users search query is empty and redirect to homepage
  if(searchquery != '') {
    const cat = req.body.cat;
    const APImovieUrl = `${apiBaseUrl}/search/movie?query=${searchquery}&api_key=${apiKey}`

    request.get(APImovieUrl,(error, response, movieData)=>{
      let parsedData = JSON.parse(movieData);
      // res.json(parsedData);
      res.render('search.ejs',
      { name: req.user.email,
        search: req.body.searchstring,
        parsedData: parsedData.results,
      })
    })
  }
  else {
    res.redirect('/');
  }
  
})


app.get('/movie/:id', checkAuthenticated, (req, res, next)=>{
  // tests..
  // res.json(req.params)
  // res.send(`${apiBaseUrl}/movie/${req.params.id}?api_key=${apiKey}`)
  var movieDetails = `${apiBaseUrl}/movie/${req.params.id}?api_key=${apiKey}`;
  
  // res.json(movieDetails)

  request.get(movieDetails,(error, response, movieData)=>{
    let parsedData = JSON.parse(movieData);
    // res.json(parsedData);
    res.render('movie.ejs',
    { name: req.user.email,
      parsedData: parsedData,
    })
  })
})


async function getallusersfromdb(db) {
  return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM USERS`,(err, row) => {
          if (err) reject(err); 
          resolve(row);
      });
  });
}



app.get('/users', checkAdmin, async (req, res) => {

  const resUsers = await getallusersfromdb(db);


  // const resUsers = db.run("Select * from users")
  console.log(resUsers)
  // users.forEach((user)=> {
  //   console.log(user.id) });

  // const resUsers = users

  console.log(users)

  res.render('users.ejs',
  { name: req.user.email,
    resUsers: resUsers
  })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    
    let sqlString = "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT, type TEXT, password TEXT)"
    db.run(sqlString)

    // db.all('Select * from users', function(err, table) {
    //   console.log(table);
    // });

    id_db = Date.now().toString();
    email_db = req.body.email;
    password_db = hashedPassword;
    type_db = req.body.type;

    // const obj = JSON.parse(JSON.stringify(req.body));
    // console.log(obj)

    users.push({
      id: Date.now().toString(),
      email: req.body.email,
      type: req.body.type,
      password: hashedPassword
    })

    // console.log('im here')
    console.log(users)

    sqlString = `INSERT OR REPLACE INTO users VALUES (${id_db},'${email_db}', '${type_db}', '${password_db}')`
    db.run(sqlString)

    // await users.save()
    mycurrusertype = type_db;
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})


app.delete('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}




function getuserfromdbbyid(id) {
    console.log("Getting the user by id from the database to check its type.");
    return new Promise((resolve) => {
        db.all("Select * from users where id='"+id+"'", function(err, table) {
          resolve(table[0]);
           })})
    };



async function checkAdmin(req, res, next) {

  const mycurruser = await getuserfromdbbyid(curruserid_server)  
  // console.log(mycurruser.type)

  if (req.isAuthenticated() & mycurruser.type == 'admin') {
    return next()
  }
  res.render('usersnotfound.ejs')
  // res.json('Oops. Looks like you are you NOT an admin User. You must be an ADMIN user to view this page')
}


function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.listen(3000)
console.log(`Server Running at port 3000. CNTL-C to quit`)
console.log(`To test, please goto: http://localhost:3000/`)
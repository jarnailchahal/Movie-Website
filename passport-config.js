const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const db = require('./server')

// function dbrun(email) {
//   db.all("Select * from users where email='"+email+"'", function(err, table) {
//     // console.log(table);
//     var response = table;
//     return response;
//   });
// }


// const getCurrentUser = () => {
//   const conn =  db.all("Select * from users where password='"+password+"'")
//   user =  console.log(conn);
//   return "jarnail";
// };


// function dbrun(email, user) {
// db.all("Select * from users where email='"+email+"' order by ID DESC LIMIT 1", function(err, table) {
//   console.log("HI there");
//   console.log(table)
//   user = table.toString()})}

function getuserfromdb(email) {
    console.log("Getting the user by email from the database to deseralize it.");
    return new Promise((resolve) => {

        db.all("Select * from users where email='"+email+"' order by ID DESC LIMIT 1", function(err, table) {
          // console.log("HI there inside dunc");
          // console.log(table);
          // temp = table
          resolve(table[0]);
          return table.toString })})

    };

  function getuserfromdbbyid(id) {
      console.log("Getting the user by id from the database to deseralize it.");
      return new Promise((resolve) => {
  
          db.all("Select * from users where id='"+id+"'", function(err, table) {
            // console.log("Hi there inside async");
            // console.log(table);
            // temp = table
            resolve(table[0]);
            return table.toString })})
  
      };



function initialize(passport, getUserByEmail, getUserById) {

  const authenticateUser = async (email, password, done) => {
    // const user = getUserByEmail(email)
    var user = "default"
    // console.log("user is in format")
    // console.log(user)
    user = await getuserfromdb(email);

    // await dbrun(email, user);
    //   console.log("HI there AGAIN");

    console.log("Current User:")
    console.log(user)


    if (user == null) {
      return done(null, false, { message: 'No user with that email' })
    }
    try {
      // console.log(user)
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser(async (id, done) => {
    user = await getuserfromdbbyid(id)
    // currusertype = user.type
    // console.log(user.type)
    return done(null, user)
  })
}

module.exports = initialize

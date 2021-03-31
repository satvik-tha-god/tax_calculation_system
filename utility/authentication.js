const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const DB = require('./../config/database.js');
const { lexicographicSortSchema } = require('graphql');
var cntr = 0;

function create (req,res,next) {

  const password = bcrypt.hashSync(req.body.password, 3);
    DB.query(`INSERT INTO users(username, password, name) VALUES('${req.body.username}','${password}','${req.body.name}')`, function (err, result) {
      if (err)
        next(err);
      else{
        res.redirect('/login');
      }
    });
};

function inputLoginCredentials(req,res,next) {
  res.render('login.ejs');
};

function inputRegistration(req,res,next) {
  res.render('signup');
};

async function validateUser(req, res, next) {

  await jwt.verify(req.cookies.token, req.app.get('secretKey'), function(err, decoded) {
    if (err) {
      req.body.loggedIn = false;
    }else{

      // add user id to request
      req.body.id = decoded.id;  
      req.body.loggedIn = true;
      console.log(req.body);
    }
  });
  next();
};

function login(req,res,next) {
    const queryString = `SELECT * FROM users WHERE username = '${req.body.username}'`;
    DB.query(queryString, function(err, rows){
       if (err) {
        next(err);
       }else{
           if(rows && rows[0] && bcrypt.compareSync(String(req.body.password), String(rows[0].password))) {
            const token = jwt.sign({id: rows[0].userid}, req.app.get('secretKey'), { expiresIn: '1h' });
            res.cookie('token', token, {
              maxAge: 1000 * 60 * 60, // 1 hour
            });
            res.redirect('/main');
           }
        }
    });
};

function logout(req,res,next) {
      if(req.cookies.token){
        res.clearCookie('token');
      }
      res.redirect('/');
};

module.exports = {
    signup: create,
    login: login,
    logout: logout,
    inputLoginCredentials,
    validateUser,
    inputRegistration
};
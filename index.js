require('dotenv').config({
    path:'config/.env'
});

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const DB = require('./config/database');
const util = require('./utility');
const { render } = require('ejs');

const app = express();

const secret = process.env.SECRET_KEY;
app.set('secretKey', secret);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
// app.use(cors());
app.use(express.static('public'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;

const auth = util.authentication;

// Routes BEGIN
app.get('/', function(req,res) {
    res.render('index.ejs');
});


// Authentication
app.get('/login', auth.inputLoginCredentials);
app.post('/login', auth.login);

app.get('/signup', auth.inputRegistration)
app.post('/signup', auth.signup);

app.get('/logout', auth.logout);


app.get("/main", auth.validateUser, function(req,res,next) {
    if(req.body.loggedIn)
    res.render("main", {user: true,tax1: "", tax2:"", minTax:"" });
    else
    res.redirect('/login');
});

function getRateOption1(value) {

    if(value >= 0 && value <= 20834)
     return 0;
    else if(value > 20834 && value <= 41667)
     return 5;
    else if(value > 41667 && value <= 83334)
     return 20;
    else
     return 30;
};

function getRateOption2(value) {
    
    if(value >= 0 && value <= 20834)
     return 0;
    else if(value > 20834 && value <= 41667)
     return 5;
    else if(value > 41667 && value <= 62500)
     return 10;
    else if(value > 62500 && value <= 83334)
     return 15;
    else if(value > 83334 && value <= 104116)
     return 20;
    else if(value > 104116 && value <= 125000)
     return 25;
    else
     return 30;
};


app.post("/main", auth.validateUser, function(req,res,next) {
    
    if(req.body) {
        var rate1 = getRateOption1(Number(req.body.income)),
            date = new Date(),
            rate2 = getRateOption2(Number(req.body.income)),
            tax1, tax2,
            p1, p2,
            minTax;

        date = date.toISOString().slice(0, 19).replace('T', ' ');

        p1 = p2 = Number(req.body.income);
        if(req.body.salaried === "YES")
         p1 -= 4166;
        p1 = p1 - Number(req.body.deductionC) - Number(req.body.deductionD) - Number(req.body.deductionE) - Number(req.body.otherDeductions);
        if(p1 <= 41667)
         rate1 = 0;

        
        tax1 = (p1 * (rate1/100));
        tax1 = tax1.toFixed(3);
        tax2 = (p2 * (rate2/100));
        minTax = tax1 < tax2 ? tax1 : tax2;
        DB.query(`INSERT INTO history(userid, date, income, total_tax) VALUES(${req.body.id}, '${date}', ${Number(req.body.income)}, ${minTax})`, function(err, data) {
            if(err)
             throw err;
            else
            res.render('main', {user: true,tax1: tax1, tax2:tax2, minTax:minTax});
        });
    }
    else{
        res.redirect('/main');
    }
});

app.get('/history', auth.validateUser, function(req, res, next) {

    if(req.body.loggedIn) {
        DB.query(`SELECT * FROM history WHERE userid = ${req.body.id} LIMIT 5`, function(err, data) {
            if(err) 
             throw err;
            else{
                var dateArray = [],
                    date;
                for(var x = 0; x < data.length; x++) {
                    date = String(data[x].date);
                    dateArray.push(date);
                }
                res.render('history', {items: data, dateArray: dateArray});
            }
        });
    }
    else
     res.redirect('/login');
   
});


app.listen(PORT, function (err) {
    if (err) throw error;
    console.log(`Server running at port ${PORT}`);
});
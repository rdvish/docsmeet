var express = require('express');

var flash = require('express-flash');

const session = require('express-session');

var MD5 = require('crypto-js/md5')

var router = express.Router();

var connection  = require('../lib/db');


router.use(session({
    secret:'s575754',
    saveUninitialized: true,
    resave: true
}));

router.use(flash());

//display register page


router.get('/', function(req, res, next){    

    // render to views/user/add.ejs
    
    res.render('auth/register', { title: 'Register' })

})


//display register page


/*router.get('/register', function(req, res, next){    

    // render to views/user/add.ejs
    
    res.render('auth/register', {

        title: 'Register'

        //email: '',

        //password: ''    

    })

})*/

router.post('/registration', function(req, res, next) {

       

    var sal = req.body.salutation;
    var fname = req.body.fname;
    var lname = req.body.lname;
    var mail = req.body.mail;
    var password = req.body.password;
    var crypt_password = MD5(password).toString();

    //users=user_id	salutation	f_name	l_name	email	user_role

        connection.query('INSERT INTO users (salutation, f_name, l_name, email, user_role) VALUES (?,?,?,?,?)', [sal,fname,lname,mail,'user'], function(err, rows) {

            if(err) throw err


            else { 

                connection.query('INSERT INTO u_passwords(user_id,u_password) VALUES ((SELECT user_id FROM users WHERE email = ?),?)', [mail,crypt_password], function(err, rows) {
                    if(err) throw err
                else
                    res.redirect('/login');
                });
            }            

        })

  

})

module.exports = router;
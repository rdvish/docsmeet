var express = require('express');

const session = require('express-session');

var MD5 = require('crypto-js/md5')

var router = express.Router();

var url = require('url')

var cookieParser = require('cookie-parser');

var connection  = require('../lib/db');

const query = (sql, params) =>
  new Promise((resolve, reject) =>
    connection.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const { io } = require("socket.io-client");

var flash = require('express-flash');

//vishweshwar imports
const multer = require('multer');
const path = require('path');
var bodyParser = require('body-parser');

const fs = require('fs');

const uploadDir = path.resolve('./uploads');          // same ./uploads folder your old code used
fs.mkdirSync(uploadDir, { recursive: true });    // creates it if it doesn't exist

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir); },
    filename: function (req, file, cb) {
      const safe = path.basename(file.originalname).replace(/[^\w.\-]/g, '_');
      cb(null, Date.now() + '-' + safe);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: function (req, file, cb) { cb(null, /^image\//.test(file.mimetype)); }
});




//global vars
let userid=0;
let meetingid=0;
let meetid;
let hosts=[];
let partuid=[];
let couid=[];
let emailserv;
let hostlen;










//var socket = io.connect("http://localhost:3000");

router.use(session({
    secret:'s575754',
    saveUninitialized: true,
    resave: true
}));

router.use(flash());
router.use(cookieParser());
router.use('/reports',express.static("C:/projects/docsmeet/project-files/reports"));

///
// parse application/json
router.use(bodyParser.json());
// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({extended: true}));



// handle single file upload
function randomString(len, charSet) {
   charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var randomString = '';
   for (var i = 0; i < len; i++) {
       var randomPoz = Math.floor(Math.random() * charSet.length);
       randomString += charSet.substring(randomPoz,randomPoz+1);
   }
   return randomString;
}

// homepage data upload done by vish
router.post('/next', upload.array('files', 10), async (req, res, next) => {
  try {
    console.log('BODY:', req.body);
    console.log('FILES:', req.files);

    // a single value arrives as a string, so always turn it into an array
    const cohostList = [].concat(req.body.cohost || []);
    const partList   = [].concat(req.body.part   || []);

    const newabspath = (req.files || []).map(function (f) { return f.path; });
    const link       = randomString(3) + "-" + randomString(3);
    const emailserv  = req.body.email;

    // hosts = co-hosts + the meeting creator (no duplicates)
    const hosts = Array.from(new Set(cohostList.concat([emailserv])));
    console.log(hosts);
    console.log("emailserv", emailserv);

    // local to this request, so they start empty every time
    const couid   = [];
    const partuid = [];

    // 1. host's user id
    const result = await query("SELECT user_id FROM users WHERE email=?", [emailserv]);
    if (result.length === 0) {
      return res.status(400).json({ error: "No user found for " + emailserv });
    }
    const userid = result[0].user_id;
    console.log("userid:", userid);

    // 2. user ids of hosts
    for (let i = 0; i < hosts.length; ++i) {
      const rows = await query("SELECT user_id FROM users WHERE email=?", [hosts[i]]);
      if (rows.length === 0) { console.log("Host not found:", hosts[i]); continue; }
      couid.push(rows[0].user_id);
    }

    // 3. user ids of participants
    for (let i = 0; i < partList.length; ++i) {
      const rows = await query("SELECT user_id FROM users WHERE email=?", [partList[i]]);
      if (rows.length === 0) { console.log("Participant not found:", partList[i]); continue; }
      partuid.push(rows[0].user_id);
    }
    console.log(couid);
    console.log(partuid);

    for (let i = 0; i < newabspath.length; ++i) {
      console.log(newabspath[i]);
    }

    // 4. insert into meetings table and use the id MySQL assigned
    const meeting = await query(
      "INSERT INTO meetings(link,meeting_host,meeting_time) VALUES (?,?,?)",
      [link, userid, req.body.time]);
    const meetid = meeting.insertId;
    console.log("Meeting id:", meetid);

    // 5. insert hosts
    for (let i = 0; i < couid.length; ++i) {
      await query("INSERT INTO participants(meeting_id,user_id,participant_role) VALUES (?,?,?)",
                  [meetid, couid[i], "Host"]);
    }

    // 6. insert participants
    for (let i = 0; i < partuid.length; ++i) {
      await query("INSERT INTO participants(meeting_id,user_id,participant_role) VALUES (?,?,?)",
                  [meetid, partuid[i], "participant"]);
    }

    // 7. insert uploaded file paths
    for (let i = 0; i < newabspath.length; ++i) {
      await query("INSERT INTO reports(meeting_id,file_owner,location) VALUES (?,?,?)",
                  [meetid, userid, newabspath[i]]);
    }

    console.log({ link: link, meetingId: meetid });
    res.redirect('/auth/meet');

  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});
/*router.post('/next',upload.array('files', 10),(req, res, next) => {
   console.log('BODY:', req.body);
console.log('FILES:', req.files);
  
    let newabspath = (req.files || []).map(function (f) { return f.path; });
    let hostno=1;
    hostno+=(req.body.cohost).length;
    let link=randomString(3)+"-"+randomString(3);
   emailserv=req.body.email;//req.body.email;
   
    hosts=(req.body.cohost);
   
   
   hosts[hostno-1]=emailserv;
   console.log(hosts);
   console.log("emailserv",emailserv);
    connection.query("SELECT * FROM users where email=?",[emailserv], function (err, result, fields) {
       // if any error while executing above query, throw error
       if (err) throw err;
       // if there is no error, you have the result
       // iterate for all the rows in result
       userid = result[0].user_id; 
       console.log("userid:", userid); 
     });
 
   connection.query("SELECT MAX(meeting_id) as maxid FROM participants ", function (err, resultss, fields) {
    
        meetingid=resultss[0].maxid;
        meetid=meetingid+1;
         console.log("Meeting id1:",meetingid);
 
        console.log("Meeting id2:",meetid);
        // if any error while executing above query, throw error
        if (err) throw err;
    });
  //meetingid=meetingid+1;


   for(let i=0;i<(hosts).length;++i){
    connection.query("SELECT * FROM users where email=?",[hosts[i]], function (err, result, fields) {
       // if any error while executing above query, throw error
       if (err) throw err;
       // if there is no error, you have the result
       // iterate for all the rows in result
       Object.keys(result).forEach(function(key) {
         var row = result[key];
         couid.push(row.user_id);
       });
     });
   }
   for(let i=0;i<(req.body.part).length;++i){
    connection.query("SELECT * FROM users where email=?",[req.body.part[i]], function (err, result, fields) {
       // if any error while executing above query, throw error
       if (err) throw err;
       // if there is no error, you have the result
       // iterate for all the rows in result
       Object.keys(result).forEach(function(key) {
         var row = result[key];
         partuid.push(row.user_id);
       });
     });
   }
   console.log(couid);
   console.log(partuid);
 
   for(let i=0;i<(newabspath).length;++i){
    console.log(newabspath[i]);
 }
   //query to insert into meetings table
    connection.query("INSERT INTO meetings(link,meeting_host,meeting_time) VALUES (?,?,?)",[link,userid,req.body.time]);
   
   //query to insert hosts along with their corresponding user ids
   for(let i=0;i<couid.length;++i){
       connection.query("INSERT INTO participants(meeting_id,user_id,participant_role) VALUES (?,?,?)",[meetid,couid[i],"Host"]);
   }
   //query to insert participants along with their corresponding user ids
   for(let i=0;i<partuid.length;++i){
       connection.query("INSERT INTO participants(meeting_id,user_id,participant_role) VALUES (?,?,?)",[meetid,partuid[i],"participant"]);
    }
    for(let i=0;i<(newabspath).length;++i){
       connection.query("INSERT INTO reports(meeting_id,file_owner,location) VALUES (?,?,?)",[meetid,userid,newabspath[i]]);
    }
 });*/



//display login page

router.get('/', function(req, res, next){    

    // render to views/user/add.ejs

    res.render('auth/login', {

        title: 'Login',

        email: '',

        password: '' ,    

        messages: req.flash('error')
    })

})


//display login page

/*router.get('/login', function(req, res, next){    

    // render to views/user/add.ejs
    
    res.render('auth/login', {

        title: 'Login',

        email: '',

        password: ''    

    })

})*/

 


//authenticate user

router.post('/authentication', function(req, res, next) {

       

    var email = req.body.email;

    var password = req.body.password;

 

        connection.query('SELECT user_id FROM users WHERE email = ?', [email], function(err, rows) {

            if(err) throw err

             

            // if user not found

            if (rows.length <= 0) {

                req.flash('error', 'Please enter correct email and password!')

                res.redirect('/login')

            }

            else { // if user found

                // render to views/user/edit.ejs template file
                var crypt_password = MD5(password).toString();
                var id=rows[0].user_id;
                //console.log("idf",id)
               // JSON.stringify(rows,function(key,value){if(key == 'id') {id=value;}});
                connection.query('SELECT u_password FROM u_passwords WHERE user_id = ?', [id], function(err, rows) {
                  //  console.log(" rows",rows[0]);
                    //console.log("crypt",crypt_password);
                    if(err) throw err

                    if (rows.length <= 0) {

                        req.flash('error', 'Please enter correct password!');
                        res.redirect('/login');
        
                    }
                    else {        
                        if(rows[0].u_password.toString() === crypt_password){
                        req.session.loggedin = true;
                        connection.query('SELECT f_name,l_name FROM users WHERE email = ?', [email], function(err, rows) {

                            if(err) throw err
                            else{
                             
                                var f_name = rows[0].f_name.toString();
                                var l_name = rows[0].l_name.toString();
                                var uname = f_name+" "+l_name;
                                //req.session.userName = uname;
                                res.cookie("userName",uname);
                                res.cookie("userEmail",email);
                                //console.log(req.session.userName);
                                req.session.userEmail= email;

                                res.redirect('/auth/home');
                            }
                        })

                        }
                        else{
                            req.flash('error', 'Please enter correct password!')
        
                            res.redirect('/login')
                        }
                }
                });

            }            

        })

  

})

/*router.post('/chats', function(req, res, next) {

    var msg = req.body.chat_msg;
    var mail = req.session.userName;
    
    connection.query('SELECT f_name,l_name FROM users WHERE email = ?', [mail], function(err, rows) {

        if(err) throw err
        else{
            //console.log(rows[0]);
            //console.log(rows[0].f_name);
            //console.log(rows[0].l_name)
            var f_name = rows[0].f_name.toString();
            var l_name = rows[0].l_name.toString();
            var uname = f_name+" "+l_name;
            socket.emit('chat',{
                message: msg,
                handle: uname
             });
        }
    });
    
});*/

 
router.get('/details', function(req, res, next) {

    if (req.session.loggedin) {

         

        res.render('auth/details', {

            title:"Details",

            name: req.session.name

        });

 

    }else{
        req.flash('error', 'Please login first!')

        res.redirect('/login')
    } 
})

router.get('/meet', function(req, res, next) {

    if (req.session.loggedin) {

         

        res.render('auth/meet', {

            title:"Meeting",

            name: req.session.name

        });

 

    } else{
        req.flash('error', 'Please login first!')

        res.redirect('/login')
    } 
})

router.get('/past', function(req, res, next) {

    if (req.session.loggedin) {

         

        res.render('auth/pastMeetings', {

            title:"Meeting",

            name: req.session.name

        });

 

    } else{
        req.flash('error', 'Please login first!')

        res.redirect('/login')
    } 
})

//display home page

router.get('/home', function(req, res, next) {

    if (req.session.loggedin) {

         

        res.render('auth/home', {

            title:"Dashboard",

            name: req.session.name

        });

 

    } else {

 

        req.flash('error', 'Please login first!');

        res.redirect('/login');

    }

});


router.get('/iframe',function(req,res){

    function getPastMeetings(email, callback){
        var responseString = '';
        poolConnection.query("SELECT m.link, u.salutation, u.f_name, DATE_FORMAT(m.meeting_time, '%d %b %Y') AS mDate FROM users u, meetings m WHERE m.meeting_host=u.user_id AND u.email=?",[email], function(err, result, fields) {
            if(err){
                // throw err;
                console.log("Query error");
                return callback(err);
            }
            else{
                if(result.length > 0){
                    let div1 = '<div class="meeting w3-hover-shadow w3-theme-l3">\n';
                    let div2 = '<div class="meeting w3-hover-shadow w3-theme-l1">\n';
                    for (let i = 0; i < result.length; i++) {
                        responseString +='<a href="meetingDetails.html?link='+result[i].link+'" target="_blank">\n';
                        if((i%2)==0)
                            responseString += div1;
                        else
                            responseString += div2;
                        responseString += '<h4>Meeting '+result[i].link+'</h4>\n';
                        responseString += 'Host: '+result[i].salutation+' '+result[i].f_name+'<br>\n';
                        responseString += 'Date: '+result[i].mDate+'<br>\n';
                        responseString += '</div>\n';
                        responseString += '</a>\n';
                    }
                }
                else
                    responseString += '<p class="w3-padding w3-center w3-theme-l3">You are not a part of any meeting</p>';
            }
            callback(null, responseString);
        });
        // console.log("Outside the query function: "+responseString);
        return responseString;
    }
    
    function getMeetingParticipants(link, callback){
        var responseString = '';
        poolConnection.query("SELECT salutation, f_name, l_name, email from users WHERE user_id IN (SELECT user_id FROM participants WHERE meeting_id = (SELECT meeting_id from meetings WHERE link = ?))",[link], function(err, result, fields) {
            if(err)
                throw err;
            else{
                if(result.length > 0){
                    let div1 = '<div class="p1 w3-padding-small w3-theme-l3">\n';
                    let div2 = '<div class="p2 w3-padding-small w3-theme-l1">\n';
                    //console.log(result);
                    for(let i = 0; i < result.length; i++){
                        // console.log(result[i].salutation+' '+result[i].f_name+' '+result[i].l_name);
                        // console.log(result[i].email+'\n');
                        if((i%2) == 0)
                            responseString += div1;
                        else
                            responseString += div2;
    
                        responseString += result[i].salutation+' '+result[i].f_name+' '+result[i].l_name+'<br>\n';
                        responseString += result[i].email+'</div>\n';
                    }
                }
                else
                    responseString += '<p class="w3-theme-l3">There are no participants for this meeting</p>';
            }
            callback(null, responseString);
        });
        return responseString;
    }
    
    function getMeetingDetails(link, callback){
        var responseString = '';
        poolConnection.query("SELECT u.salutation, u.f_name, u.l_name, DATE_FORMAT(m.meeting_time, '%d %b %Y') AS m_date FROM meetings m, users u WHERE m.link=? AND m.meeting_host=u.user_id", [link], function(err, result, fields) {
            if(err)
                throw err;
            else{
                responseString += '<h3 class="header">Meeting: ' +link+ '</h3>\n';
                responseString += '<h4 class="header">Host: ' +result[0].salutation+ ' ' +result[0].f_name+ ' ' +result[0].l_name+ '</h4>\n';
                responseString += '<h4 class="header">Date: ' +result[0].m_date+ '</h4>';
            }
            callback(null, responseString);
        });
        return responseString;
    }
    
    function loadReports(link, callback){
        var responseString = '';
        poolConnection.query("SELECT location FROM reports WHERE meeting_id = (SELECT meeting_id FROM meetings WHERE link = ?)", [link], function(err, result, fields) {
            if(err)
                throw err;
            else{
                if(result.length > 0){
                    let divRow = '<div class="w3-row-padding w3-margin-bottom">\n';
                    let divQuarter = '<div class="w3-quarter">\n';
                    let divCard = '<div class="w3-card">\n';
                    let linkA = '<a href="#"><img src="';
                    let linkB = '" alt="reportFile" class="report"></a>\n</div>\n</div>\n';
                    for(let i = 0; i < result.length; i++){
                        if((i%4) == 0)
                            responseString += divRow;
                        responseString += divQuarter+divCard;
                        responseString += linkA+ result[i].location +linkB;
                        if((i%4) == 3)
                            responseString += '</div>\n';
                    }
                    responseString += '</div>\n';
                }
                else
                    responseString += '<h4 class="w3-margin-left">No reports exist for this meeting</h4>';
                // console.log(result);
            }
            callback(null, responseString);
        });
        return responseString;
    }
    
    function startMeeting(link, email, callback){
        var responseValue = '0';
        poolConnection.query("SELECT * FROM users WHERE user_id IN (SELECT user_id FROM participants WHERE meeting_id = (SELECT meeting_id FROM meetings WHERE link = ?)) AND email = ?", [link, email], function(err, result, fields) {
            if(err)
                throw err;
            else{
                if(result.length > 0)
                    responseValue = '1';
            }
            callback(null, responseValue);
        });
        return responseValue;
    }
    
    function loadUserReports(email, callback){
        var responseString = '';
        console.log("Email: "+email);
        poolConnection.query("SELECT location FROM reports WHERE file_owner = (SELECT user_id FROM users WHERE email = ?)", [email], function(err, result, fields) {
            if(err)
                throw err;
            else{
                console.log("Result set:\n"+result);
                // if(result.length > 0){
                // 	let divRow = '<div class="w3-row-padding w3-margin-bottom">\n';
                // 	let divHalf = '<div class="w3-half">\n';
                // 	let divThird = '<div class="w3-third">\n';
                // 	let divCard = '<div class="w3-card">\n';
                // 	let linkA = '<a href="#"><img src="';
                // 	let linkB = '" alt="reportFile" class="report"></a>\n</div>\n</div>\n';
                // 	for(let i = 0; i < result.length; i += 6){
                // 		var count = 0;
                // 		responseString += divRow;
                // 		for(let j = 0; j < 2; j += 2){
                // 			responseString += divHalf;
                // 			for(let k = 0; k < 3; k++){
                // 				responseString += divThird+divCard;
                // 				responseString += linkA + result[count].location +linkB;
                // 			}
                // 			responseString += '</div>';
                // 		}
                // 		responseString += '</div>';
                // 	}
                // 	responseString += '</div>\n';
                // }
                // else
                // 	responseString += '<h4 class="w3-margin-left">No reports exist for this user</h4>';
                // console.log(result);
            }
            callback(null, responseString);
        });
        console.log(responseString);
        //return 'Heloooo';
    }
    
 
        var href = url.parse(request.url);
        if(href.pathname === '/pastMeetings'){
            var email = ((href.search).split('='))[1];
            var responseString = getPastMeetings(email, function(err, responseString){
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(responseString);
            });
        }
        else if(href.pathname === '/meetingParticipants'){
            var queryUrl = new URLSearchParams(href.search);
            var link = queryUrl.get('link');
            var responseString = getMeetingParticipants(link, function(err, responseString){
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(responseString);
            });
        }
        else if(href.pathname === '/meetingDetails'){
            var queryUrl = new URLSearchParams(href.search);
            var link = queryUrl.get('link');
            var responseString = getMeetingDetails(link, function(err, responseString){
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(responseString);
            });
        }
        else if(href.pathname === '/loadReports'){
            var queryUrl = new URLSearchParams(href.search);
            var link = queryUrl.get('link');
            var responseString = loadReports(link, function(err, responseString){
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(responseString);
            });
        }
        else if(href.pathname === '/startMeeting'){
            var queryUrl = new URLSearchParams(href.search);
            var link = queryUrl.get('link');
            var email = queryUrl.get('email');
            var responseValue = startMeeting(link,email, function(err, responseValue){
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(responseValue);
            });
        }
        else if(href.pathname === '/loadUserReports'){
            var queryUrl = new URLSearchParams(href.search);
            var email = queryUrl.get('email');
            var responseString = loadUserReports(email, function(err, responseString){
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(responseString);
            });
        }
        else
            fileServer.serve(request, response);
    });


 

// Logout user

router.get('/logout', function (req, res) {

 
  req.flash('success', 'Login Again Here');
  req.session.destroy();


  res.redirect('/login');

});

 

module.exports = router;
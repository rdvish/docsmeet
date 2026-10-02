var mysql=require('mysql2');

 /*var connection=mysql.createConnection({

   host:'localhost',

   user:'vish',

   password:'vish',

   database:'docsmeet'

 });*/

 var connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'vish',
  password: process.env.DB_PASSWORD || 'vish',
  database: process.env.DB_NAME || 'docsmeet',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

connection.connect(function(error){

   if(!!error){

     console.log(error);

   }else{

     console.log('Connected!:)');

   }

 });  

module.exports = connection; 
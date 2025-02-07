const mysql = require('mysql2')

const dotenv = require('dotenv')

dotenv.config()

const db = mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PSWD,
    database:process.env.DB_SCHEMA,
    port:process.env.DB_PORT
})

db.connect((err)=>{
    if (err) {
        console.log('Database connection Failed',err);
        
    } else {
        
        console.log('Connected to MySql Database');
    }
})

module.exports=db;
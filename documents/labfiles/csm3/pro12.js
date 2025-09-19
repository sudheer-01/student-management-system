var express=require("express");
var app=express();
app.use(express.urlencoded({extended:true}));
app.use(express.json());
var mysql = require('mysql2');

var con = mysql.createConnection(
{
  host: "localhost",
  user: "root",
  password: "sudheer@1ROOT",
  database: "forNodeJs"
}
);
app.get("/",(req,res)=>
{
res.sendFile(__dirname+"/index.html");
});
app.post("/bat",(req,res)=>
{
var uname=req.body.uname;
var pwd=req.body.pwd;
console.log(uname);
console.log(pwd);
//  con.query("INSERT INTO student VALUES(?,?)",[uname,pwd]
 con.query("SELECT * FROM student where uname=? and password=?",[uname,pwd], function (err,result,fields) {
  if (err) {
    console.error("Database query error: ", err);
    res.send("Error in query execution.");
    return;
  }
if(result.length>0)
res.sendFile(__dirname+"/f1.html");
else
res.sendFile(__dirname+"/index.html");
 });

});

app.listen(9070);


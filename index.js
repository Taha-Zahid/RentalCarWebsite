const http = require('http');
const fs = require("fs");


function InvalidEmail(res){ res.writeHead(401); res.write("Email is not valid"); res.end(); }

function ValidateEmail(res, email){
  let emailParts = email.split("@");
  if(emailParts.length != 2 || emailParts[1].length < 1 ){ InvalidEmail(res); return; }
  for (let c of emailParts.join("")){ //check alphanumeric or dot
   if(!"abcdefghijklmnopqrstuvwxyz0123456789.".includes(c.toLowerCase())){ InvalidEmail(res); return; }
  } return "users/" + emailParts[1] + "/" + emailParts[0];
}

http.createServer(function (req, res) { 
let path = req.url.slice(1).split("?")[0];
let query = new URLSearchParams(req.url.split("?")[1]) ;
let pw = query.get("pw");

if(req.method == "GET"){

if(req.url == "/"){
 res.writeHead(200, {"Content-Type": "text/html"});
 res.write(fs.readFileSync("index.html"));
}else if(path == "index.css"){
 res.writeHead(200, {"Content-Type": "text/css"});
 res.write(fs.readFileSync(path));
}else if(path.startsWith("listings/")){
 if(fs.existsSync(path)){
  res.writeHead(200);
  res.write(fs.readFileSync(path));
 }else{ res.writeHead(404); res.write("404 Not Found"); }
}

else{ res.writeHead(404); res.write("404 Not Found"); }
}if(req.method == "POST"){

if(path == "login"){ // Login Request
  let lpath = ValidateEmail(res, query.get("email"));
  if(!lpath){ return; }
  //console.log("login request:", query, lpath);
  if(!fs.existsSync(lpath)){ res.writeHead(401); res.write("Email is not registered."); res.end(); return; }
  if(fs.readFileSync(lpath+"/pw.txt") != pw){ res.writeHead(401); res.write("Password is incorrect."); res.end(); return; }
  res.writeHead(200, {"Set-Cookie": "login="+query.get("email")+";" });
  res.write("Sucessfully logged in.");

}else if(path == "signup"){ // Signup Request
 let pwErr = "";
 let lpath = ValidateEmail(res, query.get("email"));
 if(!lpath){ return; }
 //console.log("signup request:", query, lpath);
 if(pw.length < 1 ){ pwErr = "Password field is empty"; 
 }else if( pw.length < 8 ) { pwErr = "Password is shorter than 8 characters"; }
 if(pwErr != "") { res.writeHead(401); res.write(pwErr); res.end(); return; }
 if(fs.existsSync(lpath)){ res.writeHead(401); res.write("Email is already registered."); res.end(); return; }
 fs.mkdirSync(lpath, { recursive: true });
 fs.writeFileSync(lpath+"/pw.txt", pw);
 res.writeHead(200);
 res.write("Successfully Registered.");

}else if(path == "rent"){ // Rental Request
 let lpath = ValidateEmail(res, query.get("email"));
 if(!lpath){ return; }
 //console.log("rent request:", query, lpath);
 fs.writeFileSync(lpath+"/"+query.get("id")+".txt", "...");
 res.writeHead(200);
 res.write("Successfully Rented.");

}else if(path == "unrent"){ // Cancel Rental Request
 let lpath = ValidateEmail(res, query.get("email"));
 if(!lpath){ return; }
 //console.log("unrent request:", query, lpath);
 let fpath = lpath+"/"+query.get("id")+".txt";
 if(fs.existsSync(fpath)){ fs.unlinkSync(fpath); }
 res.writeHead(200);
 res.write("Successfully Cancelled.");

}else if(path == "getrent"){ // Gets a list of all cars rented by the user
 let lpath = ValidateEmail(res, query.get("email"));
 if(!lpath){ return; }
 //console.log("getrent request:", query, lpath);
 let curRentals = [] ;
 fs.readdirSync(lpath).forEach( (f) => { let a = f.split(".")[0]; if(a != "pw"){ curRentals.push(f.split(".")[0]) } }); 
 //console.log(curRentals);
 res.writeHead(200);
 res.write(curRentals.join(","));
}




}res.end();
}).listen(80);
console.log("running");
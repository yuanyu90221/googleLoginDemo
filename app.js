var http = require('http');
var express = require('express');
var Session = require('express-session');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var plus = google.plus('v1');
var os = require('os')
const ClientId = "74791052648-d13tt66205dnrb29fq1p3s26cls4925l.apps.googleusercontent.com";
const ClientSecret = "n8Ey5e8OqDIztmKfsEBnA8Rp";
var isHeroku = true;
var herokuHost = "https://glacial-fortress-49233.herokuapp.com";
//starting the express app
var app = express();

//using session in express
app.use(Session({
    secret: 'raysources-secret-19890913007',
    resave: true,
    saveUninitialized: true
}));

//this is the base route
app.get("/", function (req, res) {
    var url = getAuthUrl();
    //
    res.send(
        '<h1>Authentication using google oAuth</h1>'+'<a href="'+url+'">Login</a>');
});

// var port = 1234;
var server = http.createServer(app);
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

//app.set('port', (process.env.PORT || 5000));
server.listen(port);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
// const RedirectionUrl = "http://localhost:1234/oauthCallback";
const RedirectionUrl = (isHeroku==false)?"http://"+getIpv4()+":"+port+"/oauthCallback":herokuHost+"/oauthCallback";
//server.listen(port);
server.on('listening', function () {
    console.log(RedirectionUrl);
    console.log(`listening to ${port}`);
});
function getIpv4(){
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }

    console.log(addresses);
    if(addresses[0].includes('192.168'));
    addresses[0] = 'localhost';
    return addresses[0];
}

function getOAuthClient () {
    return new OAuth2(ClientId ,  ClientSecret, RedirectionUrl);
}

function getAuthUrl () {
    var oauth2Client = getOAuthClient();
    // generate a url that asks permissions for Google+ and Google Calendar scopes
    var scopes = [
      'https://www.googleapis.com/auth/plus.me'
    ];

    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes // If you only need one scope you can pass it as string
    });

    return url;
}

app.get("/oauthCallback", function (req, res) {
    console.log('oauthCallback');
    var oauth2Client = getOAuthClient();
    var session = req.session;
    var code = req.query.code; // the query param code
    console.log(code);
    oauth2Client.getToken(code, function(err, tokens) {
      // Now tokens contains an access_token and an optional refresh_token. Save them.
      //console.log(code);
      //console.log(err);
      if(!err) {
        oauth2Client.setCredentials(tokens);
        //saving the token to current session
        session["tokens"]=tokens;
        res.send('<h3>Login successful!!</h3>'+'<a href="/details">Go to details page</a>');
      }
      else{
        res.send("<h3>Login failed!!</h3>");
      }
    });
});
app.get("/details", function (req, res) {
    console.log("details")
    console.log(req.session["tokens"]);
    var oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(req.session["tokens"]);

    // var p = new Promise(function (resolve, reject) {
        // console.log(resolve);
        plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
           // console.log(err);
            console.log(response);
           // resolve(response || err);
            if(response.displayName){
                res.send('<img src="'+response.image.url+'"/>'+'<h3>Hello "'+response.displayName+'"</h3>');
                //break;
            }
            else{
                 res.send('get data failed');
            }

        });
    // });
});


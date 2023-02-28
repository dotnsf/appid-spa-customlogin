//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    passport = require( 'passport' ),
    request = require( 'request' ),
    session = require( 'express-session' ),
    WebAppStrategy = require( 'ibmcloud-appid' ).WebAppStrategy,
    SelfServiceManager = require( 'ibmcloud-appid' ).SelfServiceManager,
    app = express();

require( 'dotenv' ).config();
var settings_appid_secret = 'APPID_SECRET' in process.env ? process.env.APPID_SECRET : '';
var settings_appid_client_id = 'APPID_CLIENT_ID' in process.env ? process.env.APPID_CLIENT_ID : '';
var settings_appid_tenant_id = 'APPID_TENANT_ID' in process.env ? process.env.APPID_TENANT_ID : '';
var settings_appid_region = 'APPID_REGION' in process.env ? process.env.APPID_REGION : '';
var settings_appid_redirect_uri = 'APPID_REDIRECT_URI' in process.env ? process.env.APPID_REDIRECT_URI : '';
var settings_spa_url = 'SPA_URL' in process.env ? process.env.SPA_URL : '';
var settings_api_key = 'API_KEY' in process.env ? process.env.API_KEY : '';
var settings_appid_oauth_server_url = 'https://' + settings_appid_region + '.appid.cloud.ibm.com/oauth/v4/' + settings_appid_tenant_id;

//. setup session
app.use( session({
  secret: 'appid_web',
  resave: false,
  saveUninitialized: false
}));

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


//. setup passport
app.use( passport.initialize() );
app.use( passport.session() );
passport.use( new WebAppStrategy({
  tenantId: settings_appid_tenant_id,
  clientId: settings_appid_client_id,
  secret: settings_appid_secret,
  oauthServerUrl: settings_appid_oauth_server_url,
  redirectUri: settings_appid_redirect_uri
}));
passport.serializeUser( ( user, cb ) => cb( null, user ) );
passport.deserializeUser( ( user, cb ) => cb( null, user ) );

var selfServiceManager = new SelfServiceManager({
  iamApiKey: settings_api_key,
  managementUrl: settings_appid_oauth_server_url 
});


//. login UI
app.get( '/', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'login', { message: message } );
});

//. signup UI
app.get( '/signup', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'signup', { message: message } );
});

//. reset password UI
app.get( '/resetpassword', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'resetpassword', { message: message } );
});

//. set new password UI
app.get( '/newpassword', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'newpassword', { message: message } );
});

//. logout
app.get( '/appid/logout', function( req, res ){
  WebAppStrategy.logout( req );
  res.redirect( '/' );
});

//. login submit
app.post( '/appid/login/submit', bodyParser.urlencoded({extended: false}), passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
	successRedirect: '/appid/loggedin',
	failureRedirect: '/?message=login failed.',
	failureFlash : false
}));

//. loggedin
app.get( '/appid/loggedin', function( req, res ){
  var user = {};
  if( req.user ){
    user = { 
      id: req.user.id, 
      name: req.user.name,
      email: req.user.email
    };
  }
  var code = Buffer.from( JSON.stringify( user ) ).toString( 'base64' );  //. max 2048 chars

  res.redirect( settings_spa_url + '?code=' + code );
});

//. signup submit
app.post( '/appid/signup', function( req, res ){
  var language = req.body.language;
  var lastName = req.body.lastName;
  var firstName = req.body.firstName;
  var phoneNumber = req.body.phoneNumber;
  var email = req.body.email;
  var password = req.body.password;
  var confirmed_password = req.body.confirmed_password;
  if( language ){
    if( password && password == confirmed_password ){
      var userData = {
        lastName: lastName,
        firstName: firstName,
        phoneNumber: phoneNumber,
        emails: [ { value: email, primary: true } ],   //. emails[0] should be **object**
        //confirmed_password: confirmed_password,
        password: password
      };
      selfServiceManager.signUp( userData, language, null ).then( function( user ){
        res.redirect( '/' );
      }).catch( function( err ){
        console.log( { err } );
        res.redirect( '/signup?message=' + JSON.stringify( err ) );
      });
    }else{
      res.redirect( '/signup?message=password not mached.' );
    }
  }else{
    res.redirect( '/signup?message=no language specified.' );
  }
});

//. reset password submit
app.post( '/appid/resetpassword', function( req, res ){
  var language = req.body.language;
  var email = req.body.email;
  if( language && email ){
    selfServiceManager.forgotPassword( email, language, null ).then( function( user ){
      console.log( { user } );
      res.redirect( '/' );
    }).catch( function( err ){
      console.log( { err } );
      res.redirect( '/signup?message=' + JSON.stringify( err ) );
    });
  }else{
    res.redirect( '/?message=no language and/or email specified.' );
  }
});

//. set new password submit
app.post( '/appid/newpassword', async function( req, res ){
  var language = req.body.language;
  //var uuid = req.body.uuid;
  var email = req.body.email;
  var password = req.body.password;
  var confirmed_password = req.body.confirmed_password;
  if( language && email ){
    if( password && password == confirmed_password ){
      //. email から uuid を取得する必要がある
      var uuid = "";
      var obj = await getUsers();  //. { totalResults: 2, users: [ { id: "xx", email: "xxx", .. }, .. ] }
      for( var i = 0; i < obj.users.length; i ++ ){
        var user = obj.users[i];
        if( user.email.toUpperCase() == email.toUpperCase() ){
          //uuid = user.id;
          console.log( { user } );
          var profile = await getProfile( user.id );  //. { id: "xx", email: "xxx", identities: [ { id: "yy", .. }, .. ], .. }
          console.log( { profile } );
          for( var j = 0; j < profile.identities.length; j ++ ){
            var identity = profile.identities[j];
            console.log( { identity } );
            //if( identity.provider == 'cloud_directory' ){  //. 判断不要？
              uuid = identity.id;  //. この identity.id が uuid
            //}
          }
        }
      }

      if( uuid ){
        selfServiceManager.setUserNewPassword( uuid, password, language, null, null ).then( function( user ){
          console.log( { user } );
          res.redirect( '/' );
        }).catch( function( err ){
          console.log( { err } );
          res.redirect( '/?message=' + JSON.stringify( err ) );
        });
      }else{
        res.redirect( '/?message=no user information found.' );
      }
    }else{
      res.redirect( '/signup?message=password not mached.' );
    }
  }else{
    res.redirect( '/?message=no language and/or email specified.' );
  }
});

app.get( '/appid/users', async function( req, res ){
  res.contentType( 'application/json; charset=utf8' );
  var users = await getUsers();
  res.json( users );
});

//. ログイン済みでないとトップページが見れないようにする
app.all( '/*', function( req, res, next ){
  if( !req.user || !req.user.sub ){
    //. ログイン済みでない場合は強制的にログインページへ
    res.redirect( '/' );
  }else{
    next();
  }
});

//. アクセストークンを取得
async function getAccessToken(){
  return new Promise( async ( resolve, reject ) => {
    //. GET an IAM token
    //. https://cloud.ibm.com/docs/appid?topic=appid-manging-api&locale=ja
    var headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };
    var option = {
      url: 'https://iam.cloud.ibm.com/oidc/token',
      method: 'POST',
      body: 'grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=' + settings_api_key,
      headers: headers
    };
    request( option, ( err, res, body ) => {
      if( err ){
        console.log( err );
        resolve( null );
      }else{
        body = JSON.parse( body );
        var access_token = body.access_token;
        resolve( access_token );
      }
    });
  });
}

//. ユーザーIDからプロファイルを取得
async function getProfile( user_id ){
  return new Promise( async ( resolve, reject ) => {
    var access_token = await getAccessToken();
    if( access_token ){
      //console.log( 'access_token = ' + access_token );
      //. https://cloud.ibm.com/docs/appid?topic=appid-user-admin
      var headers1 = {
        accept: 'application/json',
        authorization: 'Bearer ' + access_token
      };
      var option1 = {
        url: settings_appid_oauth_server_url + '/users/' + user_id + '/profile',
        method: 'GET',
        headers: headers1
      };
      request( option1, ( err1, res1, body1 ) => {
        if( err1 ){
          console.log( 'err1', err1 );
          reject( err1 );
        }else{
          var profile = JSON.parse( body1 );
          resolve( profile );

          /*
          //. カスタム属性
          var headers2 = {
            accept: 'application/json',
            authorization: 'Bearer ' + access_token
          };
          var option2 = {
            url: 'https://' + settings.region + '.appid.cloud.ibm.com/management/v4/' + settings.tenantId + '/users/' + user_id + '/roles',
            method: 'GET',
            headers: headers2
          };
          request( option2, ( err2, res2, body2 ) => {
            if( err2 ){
              console.log( 'err2', err2 );
              reject( err2 );
            }else{
              //. this means no error
              body2 = JSON.parse( body2 );
              var roles = body2.roles;

              //. カスタム属性
              //. https://qiita.com/yo24/items/7b577891d67cec52d9b2

              //console.log( profile, roles );
              console.log( JSON.stringify( profile, null, 2 ) );
              resolve( { status: true, profile: profile, roles: roles } );
            }
          });
          */
        }
      });
    }
  });
}

//. ユーザー一覧を取得
async function getUsers(){
  return new Promise( async ( resolve, reject ) => {
    var access_token = await getAccessToken();
    if( access_token ){
      //console.log( 'access_token = ' + access_token );
      //. https://cloud.ibm.com/docs/appid?topic=appid-user-admin
      var headers1 = {
        accept: 'application/json',
        authorization: 'Bearer ' + access_token
      };
      var option1 = {
        url: settings_appid_oauth_server_url + '/users',
        method: 'GET',
        headers: headers1
      };
      request( option1, ( err1, res1, body1 ) => {
        if( err1 ){
          console.log( 'err1', err1 );
          reject( err1 );
        }else{
          var users = JSON.parse( body1 );
          resolve( users );
        }
      });
    }
  });
}


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );


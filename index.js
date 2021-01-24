const express=require('express');
const app=express();
const CONFIG=require('./config')
const google=require('googleapis').google
const cookie_parser=require('cookie-parser')
const jwt=require('jsonwebtoken')
app.set('view engine','ejs')
app.set('views',__dirname)

app.use(cookie_parser())
const OAuth2=google.auth.OAuth2
app.get('/',(req,res)=>{
   const oauth2client=new OAuth2(
   CONFIG.oauth2Credentials.client_id,
   CONFIG.oauth2Credentials.client_secret,
   CONFIG.oauth2Credentials.redirect_uris[0]
   )
   const loginlink=oauth2client.generateAuthUrl({
       access_type:'offline',
       scope:CONFIG.oauth2Credentials.scopes

   })
   return res.render('index',{loginlink:loginlink})
})
app.get('/oauth2callback',(req,res)=>{
    const oauth2client=new OAuth2(
        CONFIG.oauth2Credentials.client_id,
        CONFIG.oauth2Credentials.client_secret,
        CONFIG.oauth2Credentials.redirect_uris[0]

    )

    if(req.query.error){
        res.redirect('/')
    }
    else {
        oauth2client.getToken(req.query.code,function(err,token){
            if(err){
                return res.redirect('/')
            }
            res.cookie('jwt',jwt.sign(token,CONFIG.JWTsecret))

            return res.redirect('/subscriptions')
           

        }
        )
    }
})
app.get('/subscriptions',(req,res)=>{
    if(!req.cookies.jwt){
        res.redirect('/')
    }
    const oauth2client=new OAuth2(
        CONFIG.oauth2Credentials.client_id,
        CONFIG.oauth2Credentials.client_secret,
        CONFIG.oauth2Credentials.redirect_uris[0]

    )
    oauth2client.credentials=jwt.verify(req.cookies.jwt,CONFIG.JWTsecret)
    const service=google.youtube("v3")
    service.subscriptions.list({
        auth:oauth2client,
        mine:true,
        part:"snippet,contentDetails",
        maxResults:100


    })
    .then((response)=>{
        // console.log(res)
        console.log(response.data.items[0].snippet.resourceId)
        // return res.render('subscriptions',{subscriptions:res.data.items})
         return res.render('subscriptions', { subscriptions: response.data.items })
    })
    .catch(err=>{
        console.log(err)
    })

    
})
app.listen(8080,()=>{
    console.log("server started");
})
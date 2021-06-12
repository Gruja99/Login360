
const User = require('../mongo/mongo');
require('dotenv').config(); 
const jwt = require('jsonwebtoken');
const mailgun = require("mailgun-js");
const mg = mailgun({apiKey: process.env.APIKEY, domain: process.env.DOMAIN})

const accountSid = process.env.SID;
const authToken = process.env.TOKEN;
const tw = require('twilio')(accountSid, authToken);

const otp = Math.floor(10000 +Math.random()*90000);


exports.singup = async function(req, res)
{
    console.log(req.body)
    const {email, password} = req.body;
    const user  = await User.findOne({email});
        if(user)
        {
           return res.status(400).json({error: `Email ${user.email} exist in application`});
     
        }
     
        const token = await jwt.sign({email, password}, process.env.JWT, {expiresIn:"10m"})

const data = {
    from: "luka@grujic.com",
    to: email,
    subject: 'Account activate link',
    html: `
    <h1>Open link:</h1>
    <p>${process.env.URL}/activate/${token}</p>
    `
};
 await mg.messages().send(data, (error)=>
{
    if(error)
    {
        return res.json({
            error: error.message
        })
    }
    return res.json({message: 'Email is send'});
});

}

exports.emailActivate = async function(req, res) {
const {token} = req.body;
if(token)
{
    return res.json({error: "Don't have token"})
}
   await jwt.verify(token, process.env.JWT, async(error, openToken)=>
    {
        if(error)
        {
            return res.status(400).json({error: "Incorrect or Expired link."})
        }
        const {email, password} = openToken;
       
        
       const user = await User.findOne({email})
        
            if(user)
            {
               return res.status(400).json({error: `Email ${user.email} exist in application`});
         
            }
               let newUser = new User({email, password});
                 await newUser.save((error) => {
             if(error)
             {
                return res.status(400).json({error: "Don't activate"})
              }
              res.json({
                message: "Singup success"
                    });

            });
       
    });
}


exports.logIn = async function(req, res)
{
    const {email, password} = req.body;
    const user =  await User.findOne({email});

        if(!user)
        {
           return res.status(400).json({error: `User don't exist `});
     
        }
        if(user.password !== password)
        {
            return res.status(400).json({error: `Bad password `});
        }
        if(user.sms != false)
        {
           
await tw.messages.create({
            body: `Verify code is ${otp}`,
            from: process.env.NUMBER,
            to: user.phone
}, (err)=> {if(err)
            { return res.status(400).json({error: `Don't send `});
            
        }});
        return res.status(200).json({message: `Verify `});
    }
        const token = await jwt.sign({email, password}, process.env.LOGIN, {expiresIn:"3d"})
        
        res.json({token})
 

}

exports.changePass = async function(req, res) {
    const{token, password,newpassword} = req.body;
if(!token)
{
    return res.json({error: "Don't have token"})
}
       await jwt.verify(token, process.env.LOGIN, async(error, openToken)=>
        {  
            if(error)
        {
            return res.status(400).json({error: "Incorrect or Expired link."})
        }
        const{email} = openToken;
        const user = await User.findOne({email})
        
        if(!user)
        {
           return res.status(400).json({error: `User does't exist `});
     
        }
       
        if(user.password !== password)
        {
            return res.status(400).json({error: `Bad password `});
        }
        await User.findOneAndUpdate({email:email}, {password:newpassword},async(error)=>
        {
            if(error)
            {
                return res.status(400).json({error: `Don't change `});

            }
            return res.json({message: `Change password`});
        });


        
    });

}

exports.smsrequest = async function(req, res)
{
    const{token, sms,phone} = req.body;
    if(!token || !sms || !phone)
    {
        return res.json({error: "Don't have parametars"})
    }
           await jwt.verify(token, process.env.LOGIN, async(error, openToken)=>
            {  
                if(error)
            {
                return res.status(400).json({error: "Incorrect or Expired link."})
            }
            const{email} = openToken;
            const user = await User.findOne({email})
            
            if(!user)
            {
               return res.status(400).json({error: `User does't exist `});
         
            }
            await User.findOneAndUpdate({email:email}, {sms:sms, phone:phone},async(error)=>
            {
                if(error)
                {
                    return res.status(400).json({error: `Don't change `});
    
                }
                return res.json({message: `Change parametars`});
            });


         });

}
exports.smsverify = async function(req, res)
{
const {code, email, password} = req.body
if(!code)
{
    return res.json({error: "Don't have code"})
}

if(otp != Number(code))
{
    return res.status(400).json({error: `Don't good code`});
}
const token = await jwt.sign({email, password}, process.env.LOGIN, {expiresIn:"3d"})
        
 return res.json({token})

}
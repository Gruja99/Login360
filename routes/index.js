var express = require('express');
var router = express.Router();
const {singup, emailActivate, logIn, changePass, smsrequset} = require("../controller/auth")
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Luka Grujic' });
});

router.post('/singup', singup )
router.post('/email-activate', emailActivate )
router.post('/login', logIn )
router.post('/change-password', changePass)
router.post('/sms-request', smsrequset)
module.exports = router;

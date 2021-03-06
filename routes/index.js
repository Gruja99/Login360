var express = require("express");
var router = express.Router();
const {
  singup,
  emailActivate,
  logIn,
  changePass,
  smsrequest,
  smsverify,
} = require("../controller/auth");

router.post("/singup", singup);
router.post("/email-activate", emailActivate);
router.post("/login", logIn);
router.post("/change-password", changePass);
router.post("/sms-request", smsrequest);
router.post("/sms-verify", smsverify);
module.exports = router;

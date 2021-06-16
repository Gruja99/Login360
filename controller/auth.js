const User = require("../mongo/user");
const Code = require("../mongo/code");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const mailgun = require("mailgun-js");
const bcrypt = require("bcrypt");
const { validatePassword, validateEmail } = require("../service/validate");
const { sendmail, verifyCode, sendSMS } = require("../service/service");
const mg = mailgun({ apiKey: process.env.APIKEY, domain: process.env.DOMAIN });

const accountSid = process.env.SID;
const authToken = process.env.TOKEN;
const tw = require("twilio")(accountSid, authToken);
/**
 * Singin
 * @param {string} email Set your email address
 * @param {string} password Set word with lowercase and uppercase letters and numbers
 */
exports.singup = async function (req, res) {
  const { email, password } = req.body;
  if (
    !email ||
    !validateEmail(email) ||
    !password ||
    !validatePassword(password)
  ) {
    return res.status(400).json({ error: `Email and password must have form` });
  }

  const user = await User.findOne({ email });
  if (user) {
    return res
      .status(400)
      .json({ error: `Email ${user.email} exist in application` });
  }
  // hash password
  const cpassword = await bcrypt.hash(password, 10).catch((error) => {
    res.json({ error });
  });
  const token = await jwt.sign({ email, cpassword }, process.env.JWT, {
    expiresIn: "50m",
  });
  // set data for email
  const emailData = sendmail(email, token);
  try {
    const mgResponse = await mg.messages().send(emailData);
    if (!mgResponse) {
      return res
        .status(400)
        .json({ error: `Mail for verification don't send` });
    }
    return res.json({ message: "Email is send" });
  } catch (e) {
    return res
      .status(400)
      .json({ error: `Mail for verification don't send: ${e.message}` });
  }
};
/**
 * Active email with token
 * @param {string} token Token .
 */
exports.emailActivate = async function (req, res) {
  const { token } = req.body;
  if (!token) {
    return res.json({ error: "Don't have token." });
  }
  // verification token
  var openToken;
  try {
    openToken = await jwt.verify(token, process.env.JWT);
  } catch (e) {
    return res.status(400).json({ error: "Incorrect or Expired token." });
  }

  const { email, cpassword } = openToken;
  const user = await User.findOne({ email });

  if (user) {
    return res
      .status(400)
      .json({ error: `Email ${user.email} exist in application` });
  }
  // create user in base
  let newUser = new User({ email, password: cpassword });
  await newUser.save((error) => {
    if (error) {
      return res.status(400).json({ error: "New user not saved" });
    }
    res.json({
      message: "You have successfully signed up",
    });
  });
};
/**
 * Login part
 * @param {string} email Set email from singup.
 * @param {string} password Set password from singup
 
 */
exports.logIn = async function (req, res) {
  const { email, password } = req.body;
  if (
    !email ||
    !validateEmail(email) ||
    !password ||
    !validatePassword(password)
  ) {
    return res.status(400).json({ error: `Email and password must have form` });
  }
  const user = await User.findOne({ email });
  // check all parameters
  if (!user) {
    return res.status(400).json({ error: `User don't exist in base ` });
  }
  // check password from base and body
  const checkpassword = await bcrypt.compare(password, user.password);
  if (!checkpassword) {
    return res.status(400).json({ error: `Bad password ` });
  }
  if (!user.sms) {
    const token = await jwt.sign({ email, password }, process.env.LOGIN, {
      expiresIn: "3d",
    });
    return res.json({ token });
  }
  // create code for sms
  const otp = verifyCode(user._id);
  const smsData = sendSMS(otp, user.phone);
  // try to send SMS message

  try {
    const smsRes = await tw.messages.create(smsData);
    if (!smsRes) {
      return res.status(400).json({ error: `SMS for verification don't send` });
    }
  } catch (error) {
    return res.status(400).json({ error: `SMS for verification don't send` });
  }

  return res.status(200).json({ message: `Your SMS send for login ` });
};
/**
 * Change password
 * @param {string} token Token .
 * @param {String} password Old password
 * @param {string} newpassword New password
 */
exports.changePass = async function (req, res) {
  const { token, password, newpassword } = req.body;
  if (!token) {
    return res.json({ error: "Don't have token." });
  }

  var openToken;
  try {
    openToken = await jwt.verify(token, process.env.LOGIN);
  } catch (e) {
    return res.status(400).json({ error: "Incorrect or Expired token." });
  }

  const { email } = openToken;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: `User don't exist in base ` });
  }
  // check password
  const checkpassword = await bcrypt.compare(password, user.password);
  if (!checkpassword) {
    return res.status(400).json({ error: `Bad password ` });
  }
  // replace with new password
  const diferentPassword = await bcrypt.hash(newpassword, 10).catch((error) => {
    res.json({ error });
  });
  try {
    await User.findOneAndUpdate(
      { email: email },
      { password: diferentPassword }
    );
    return res.json({ message: `Change password is successful.` });
  } catch (e) {
    return res.status(400).json({ error: `Password not change.` });
  }
};
/**
 * Request for sms two way verification
 * @param {string} token Token .
 * @param {boolean} sms True or False .
 * @param {string} phone Number phone 7  .
 */

exports.smsrequest = async function (req, res) {
  const { token, sms, phone } = req.body;
  if (!token || !sms || !phone) {
    return res.json({ error: "Don't have parametars or sms set false" });
  }
  var openToken;
  try {
    openToken = await jwt.verify(token, process.env.LOGIN);
  } catch (e) {
    return res.status(400).json({ error: "Incorrect or Expired token." });
  }
  const { email } = openToken;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: `User don't exist in base ` });
  }
  // Find that user than add sms and phone
  try {
    await User.findOneAndUpdate({ email: email }, { sms: sms, phone: phone });
    return res.json({ message: `Data changed in base, now repeat login` });
  } catch (e) {
    return res
      .status(400)
      .json({ error: `Parametars for this user don't change ` });
  }
};

/**
 * Write number from sms
 * @param {string} code Code.
 */
exports.smsverify = async function (req, res) {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Don't have code in input field." });
  }
  // Find user width that code
  try {
    const userCode = await Code.findOne({ code: code }).populate({
      path: "user",
    });

    if (!userCode.user) {
      return res.status(400).json({ error: "Don't have user in base." });
    }
    let email = userCode.user.email;
    let password = userCode.user.password;
    // create token agen
    const token = await jwt.sign({ email, password }, process.env.LOGIN, {
      expiresIn: "3d",
    });
    return res.json({ token });
  } catch (e) {
    return res.status(400).json({ error: "Don't have code in base." });
  }
};

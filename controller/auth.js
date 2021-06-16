const User = require("../mongo/user");
const Code = require("../mongo/code");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const mailgun = require("mailgun-js");
const bcrypt = require("bcrypt");
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
  const user = await User.findOne({ email });
  if (user) {
    return res
      .status(400)
      .json({ error: `Email ${user.email} exist in application` });
  }
  const cpassword = await bcrypt.hash(password, 10).catch((error) => {
    res.json({ error });
  });
  const token = await jwt.sign({ email, cpassword }, process.env.JWT, {
    expiresIn: "50m",
  });

  const data = {
    from: "luka@grujic.com",
    to: email,
    subject: "Account activate link",
    html: `
    <h1>Open link:</h1>
    <p>${process.env.URL}/activate/${token}</p>
    `,
  };
  try {
    const mgResponse = await mg.messages().send(data);
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
    const openToken = await jwt.verify(token, process.env.JWT);
    if (!openToken) {
      res.status(400).json({ error: "Incorrect or Expired token." });
    }
  const { email, cpassword } = openToken;
  const user = await User.findOne({ email });
  
  if (user) {
    return res
      .status(400)
      .json({ error: `Email ${user.email} exist in application` });
  }

  let newUser = new User({ email, password: cpassword });
  await newUser.save((error) => {
    if (error) {
      return res.status(400).json({ error: "New user not saved" });
    }
    res.json({
      message: "Singup success",
    });
  });
};

// create key for sms login
const verifyCode = function (user) {
  const otp = Math.floor(10000 + Math.random() * 90000);
  let newCode = new Code({ user: user, code: otp });
  newCode.save((error) => {
    if (error) {
      return res.status(400).json({ error: "Code for sms not  created" });
    }
  });

  return newCode.code;
};
/**
 * Login part
 * @param {string} email Set email from singup.
 * @param {string} password Set password from singup
 
 */
exports.logIn = async function (req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: `User don't exist in base ` });
  }

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

  const otp = verifyCode(user._id);
  try {
    const smsRes = await tw.messages.create({
      body: `Verify code is ${otp}`,
      from: process.env.NUMBER,
      to: user.phone,
    });
    if (!smsRes) {
      return res.status(400).json({ error: `SMSi for verification don't send` });
    }
  } catch (error) {
   return  res
      .status(400)
      .json({ error: `SMSa for verification don't send` });
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
  await jwt.verify(token, process.env.LOGIN, async (error, openToken) => {
    if (error) {
      return res.status(400).json({ error: "Incorrect or Expired token." });
    }
    const { email } = openToken;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: `User don't exist in base ` });
    }
    const checkpassword = await bcrypt.compare(password, user.password);
    if (!checkpassword) {
      return res.status(400).json({ error: `Bad password ` });
    }
    const diferentPassword = await bcrypt
      .hash(newpassword, 10)
      .catch((error) => {
        res.json({ error });
      });
    await User.findOneAndUpdate(
      { email: email },
      { password: diferentPassword },
      async (error) => {
        if (error) {
          return res.status(400).json({ error: `Password not change.` });
        }
        return res.json({ message: `Change password is successful.` });
      }
    );
  });
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
    return res.json({ error: "Don't have parametars" });
  }
  await jwt.verify(token, process.env.LOGIN, async (error, openToken) => {
    if (error) {
      return res.status(400).json({ error: "Incorrect or Expired token." });
    }
    const { email } = openToken;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: `User don't exist in base ` });
    }
    await User.findOneAndUpdate(
      { email: email },
      { sms: sms, phone: phone },
      async (error) => {
        if (error) {
          return res
            .status(400)
            .json({ error: `Parametars for this user don't change ` });
        }
        return res.json({ message: `Data changed in base, now repeat login` });
      }
    );
  });
};

/**
 * Write number from sms
 * @param {string} code Code.
 */
exports.smsverify = async function (req, res) {
  const { code } = req.body;
  if (!code) {
    return res.json({ error: "Don't have code in input field." });
  }

  const userCode = await Code.findOne({ code: code }, (error) => {
    if (error) {
      return res.json({ error: "Don't have code in base." });
    }
  }).populate({ path: "user" });

  if (!userCode.user) {
    return res.json({ error: "Don't have user in base." });
  }
  let email = userCode.user.email;
  let password = userCode.user.password;

  const token = await jwt.sign({ email, password }, process.env.LOGIN, {
    expiresIn: "3d",
  });
  return res.json({ token });
};

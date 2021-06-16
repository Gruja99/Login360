const Code = require("../mongo/code");
const sendmail = (email, token) => {
  return {
    from: "luka@grujic.com",
    to: email,
    subject: "Account activate link",
    html: `
    <h1>Open link:</h1>
    <p>${process.env.URL}/activate/${token}</p>
    `,
  };
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

const sendSMS = (otp, phone) => {
  return {
    body: `Verify code is ${otp}, disappears after 5 minutes`,
    from: process.env.NUMBER,
    to: phone,
  };
};
exports.sendmail = sendmail;
exports.verifyCode = verifyCode;
exports.sendSMS = sendSMS;

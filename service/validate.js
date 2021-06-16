const passwordValidator = require("password-validator");
const validator = require("email-validator");
const validatePassword = (password) => {
  // Create a schema
  var schema = new passwordValidator();

  // Add properties to it
  schema
    .is()
    .min(5) // Minimum length 5
    .has()
    .uppercase() // Must have uppercase letters
    .has()
    .lowercase() // Must have lowercase letters
    .has()
    .not()
    .spaces() // Should not have spaces
    .is()
    .not()
    .oneOf(["Passw0rd", "Password123"]); // Blacklist these values

  return schema.validate(password);
};
const validateEmail = (email) => {
  return validator.validate(email);
};

exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;

const mongoose = require("mongoose");
const { Schema } = mongoose;

const CodeSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: {
      type: String,
    },
    smscode: {
      type: String,
    },
   
  },
  {
    timestamps: true,
    autoCreate: true,
  }
);

const Code = mongoose.model("Code", CodeSchema);

module.exports = Code;

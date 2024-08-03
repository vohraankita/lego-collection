const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
dotenv.config();

let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;

function initialize() {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGODB, {
      dbName: "web322",
    });
    db.on("error", (err) => {
      reject(err);
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
}

function registerUser(userData) {
  return new Promise((resolve, reject) => {
    let { password, password2 } = userData;
    if (password !== password2) {
      reject("Passwords do not match");
    }
    let newUser = new User(userData);
    bcrypt
      .hash(newUser.password, 10)
      .then((hash) => {
        newUser.password = hash;
        newUser
          .save()
          .then((err) => {
            resolve();
          })
          .catch((err) => {
            if (err.code === 11000) {
              reject("User Name already taken");
            }
            reject(`There was an error creating the user: ${err}`);
          });
      })
      .catch((err) => {
        reject(`There was an error encrypting the password`);
      });
  });
}

function checkUser(userData) {
  return new Promise((resolve, reject) => {
    let { userName, password, userAgent } = userData;
    User.find({ userName })
      .exec()
      .then((user) => {
        if (user && user.length > 0) {
          bcrypt
            .compare(password, user[0].password)
            .then((result) => {
              if (!result) {
                reject("Incorrect Password for user: " + userName);
                return;
              }
              if (!user[0].loginHistory.length === 8) {
                user[0].loginHistory.pop();
              }
              user[0].loginHistory.unshift({
                dateTime: new Date().toString(),
                userAgent: userAgent,
              });
              User.updateOne(
                { userName: userName },
                { $set: { loginHistory: user[0].loginHistory } },
              )
                .exec()
                .then(() => {
                  resolve(user[0]);
                })
                .catch((error) => {
                  reject(`There was an error verifying the user: ${error}`);
                });
            })
            .catch(() => {
              reject("Incorrect Password for user: " + userName);
            });
        } else {
          reject("Unable to find user: " + userName);
        }
      });
  });
}

module.exports = { initialize, registerUser, checkUser };

/********************************************************************************
 *  WEB322 – Assignment 05
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Ankita Vohra Student ID: 141823229 Date: 08/03/2024
 *
 *  Published URL: https://lego-collection-five.vercel.app/
 *
 ********************************************************************************/
require("pg");
const path = require("path");
const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const express = require("express");
const clientSessions = require("client-sessions");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(
  clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18SpFQr",
    duration: 5 * 60 * 1000,
    activeDuration: 1000 * 60 * 5,
  }),
);
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
const ensureLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
};

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/lego/addSet", async (req, res) => {
  let themes = await legoData.getAllThemes();
  res.render("addSet", { themes: themes });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  console.log(req.body);
  authData.checkUser(req.body).then(
    (user) => {
      req.session.user = user;
      res.redirect("/lego/sets");
    },
    (err) => {
      res.render("login", { message: err, userName: req.body.userName });
    },
  );
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", { message: "User created" });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.get("/lego/sets", async (req, res) => {
  let sets = [];

  try {
    if (req.query.theme) {
      sets = await legoData.getSetsByTheme(req.query.theme);
    } else {
      sets = await legoData.getAllSets();
    }

    res.render("sets", { sets });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", { set });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.use(ensureLogin);

app.post("/lego/addSet", async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/lego/editSet/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    let themes = await legoData.getAllThemes();

    res.render("editSet", { set, themes });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

app.post("/lego/editSet", async (req, res) => {
  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/lego/deleteSet/:num", async (req, res) => {
  try {
    await legoData.deleteSet(req.params.num);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

app.get("/userHistory", (req, res) => {
  res.render("userHistory");
});

app.use((req, res, next) => {
  res.status(404).render("404", {
    message: "I'm sorry, we're unable to find what you're looking for",
  });
});

console.log("Starting server...");

legoData
  .initialize()
  .then(() => {
    console.log("legoData initialized successfully.");
    return authData.initialize();
  })
  .then(() => {
    console.log("authData initialized successfully.");
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize:", err);
    process.exit(1); // Exit the process if initialization fails
  })

module.exports = app;

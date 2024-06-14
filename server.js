/********************************************************************************
 *  WEB322 – Assignment 03
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Ankita Vohra Student ID: 141823229 Date: 06/14/2024
 *
 *  Published URL: ___________________________________________________________
 *
 ********************************************************************************/

const legoData = require("./modules/legoSets");

const express = require("express");
const path = require("path");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/about.html"));
});

app.get("/lego/sets", async (req, res) => {
  // check for theme query parameter
  const theme = req.query.theme;
  if (theme) {
    try {
      let sets = await legoData.getSetsByTheme(theme);
      res.send(sets);
    } catch (err) {
      res.sendStatus(404);
    }
    return;
  }
  let sets = await legoData.getAllSets();
  res.send(sets);
});

app.get("/lego/sets/:id", async (req, res) => {
  const id = req.params.id;
  try {
    let set = await legoData.getSetByNum(id);
    res.send(set);
  } catch (err) {
    res.sendStatus(404);
  }
});

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "/views/404.html"));
});

legoData.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`server listening on: ${HTTP_PORT}`);
  });
});

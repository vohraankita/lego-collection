require("dotenv").config();

// Establish connection to the database
const Sequelize = require("sequelize");
let sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
);

// Define models

const Theme = sequelize.define(
  "Theme",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: Sequelize.STRING,
  },
  { timestamps: false },
);

const Set = sequelize.define(
  "Set",
  {
    set_num: { type: Sequelize.STRING, primaryKey: true },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    img_url: Sequelize.STRING,
  },
  { timestamps: false },
);

Set.belongsTo(Theme, { foreignKey: "theme_id" });

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject("Unable to sync the database: " + e.toString());
      });
  });
}

function getAllSets() {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: Theme,
    })
      .then((sets) => {
        resolve(sets);
      })
      .catch((e) => {
        reject("No results returned: " + e.toString());
      });
  });
}

function getSetByNum(setNum) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      where: { set_num: setNum },
      include: Theme,
    })
      .then((data) => {
        if (data) {
          resolve(data[0]);
        } else {
          reject("Unable to find requested set");
        }
      })
      .catch((e) => {
        reject("No results returned: " + e.toString());
      });
  });
}

function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: Theme,
      where: {
        "$Theme.name$": {
          [Sequelize.Op.iLike]: `%${theme}%`,
        },
      },
    })
      .then((data) => {
        if (data) {
          resolve(data);
        } else {
          reject("Unable to find requested sets");
        }
      })
      .catch((e) => {
        reject("No results returned: " + e.toString());
      });
  });
}

function getAllThemes() {
  return new Promise((resolve, reject) => {
    Theme.findAll()
      .then((themes) => {
        resolve(themes);
      })
      .catch((e) => {
        reject("No results returned:" + e.toString());
      });
  });
}

function addSet(set) {
  return new Promise((resolve, reject) => {
    Set.create(set)
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject("Unable to create set: " + e.errors[0].message);
      });
  });
}

function editSet(set) {
  return new Promise((resolve, reject) => {
    Set.update(set, {
      where: { set_num: set.set_num },
    })
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject("Unable to update set: " + e.errors[0].message);
      });
  });
}

function deleteSet(setNum) {
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: { set_num: setNum },
    })
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject("Unable to delete set: " + e.errors[0].message);
      });
  });
}

module.exports = {
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  getAllThemes,
  addSet,
  editSet,
  deleteSet,
};

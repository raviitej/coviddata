const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeServerAndDbConnection = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3002, () => {});
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeServerAndDbConnection();

// API 1
convertStatedata = (each) => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  };
};

app.get("/states/", async (request, response) => {
  const dbQuery = `SELECT * FROM state`;
  const stateData = await db.all(dbQuery);
  response.send(stateData.map((each) => convertStatedata(each)));
});

// API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const dbQuery = `SELECT * FROM state WHERE state_id=${stateId}`;
  const stateDetails = await db.get(dbQuery);
  response.send(convertStatedata(stateDetails));
});

// API 3

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postQuery = `INSERT INTO  district (district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const postResponse = await db.run(postQuery);
  const dstId = postResponse.lastID;
  console.log(dstId);
  response.send("District Successfully Added");
});

// API4

const convertDistrictData = (each) => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `SELECT
        *
        FROM
        district
        WHERE
        district_id = ${districtId};`;
  const districtHistory = await db.get(districtQuery);
  response.send(convertDistrictData(districtHistory));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM
      district
    WHERE
      district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

// API 6

app.put("//districts/:districtId//", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postQuery = `UPDATE  district SET district_name = '${districtName}',state_id = ${stateId},cases = ${cases},cured = ${cured},active = ${active} ,deaths=${deaths} WHERE district_id =${districtID};`;
  await db.run(postQuery);
  response.send("District Details Updated");
});

// API7
const staticalData = (each) => {
  return {
    totalCases: each.totalCases,
    totalCured: each.totalCured,
    totalActive: each.totalActive,
    totalDeaths: each.totalDeaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const dbQuery = `SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) As totalActive,SUM(deaths) As totalDeaths FROM district WHERE state_id = ${stateId}; `;
  const stateData = await db.all(dbQuery);
  response.send(stateData.map((each) => staticalData(each)));
});

//API8
const states = (each) => {
  return {
    stateName: each.state_name,
  };
};

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const dbQuery = `SELECT state_name  FROM district WHERE district_id = ${districtId}; `;
  const stateData = await db.all(dbQuery);
  response.send(stateData.map((each) => states(each)));
});

module.exports = app;

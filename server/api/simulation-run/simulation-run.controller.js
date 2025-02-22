/**
 */
"use strict";
import {
  ParameterSearch,
  SimulationRun,
  Configuration,
} from "./simulation-run.model";
import mongoose from "mongoose";

var JSZip = require("jszip");
var Grid = require("gridfs-stream");
var gfs = Grid(mongoose.connection.db, mongoose.mongo);
var axios = require("axios");

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function packageDownload(res) {
  return function (entity) {
    var zip = new JSZip();
    zip.file("ArkheiaDocumentBody.json", String(entity));

    for (let r of entity.results) {
      zip.file(r.file_name, gfs.createReadStream({ _id: r.figure.id }));
    }

    res.attachment("ArkheiaDocument.zip");
    return zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(res);
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of SimulationRuns
export function index(req, res) {
  var query = new Object();
  if ("query" in req.params) {
    var a = req.params.query.split("~")[0];
    var b = req.params.query.split("~")[1];
    query[a] = b;
  }
  query["from_parameter_search"] = true; // TODO: Is this functional?
  return SimulationRun.find(query)
    .select("-results")
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single SimulationRun including with populated results from the DB
export function download(req, res) {
  return SimulationRun.findById(req.params.id)
    .exec()
    .then(packageDownload(res));
}

export function result(req, res) {
  return SimulationRun.findById(req.params.id)
    .populate("results.figure")
    .exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function changeParamSearchName(req, res) {
  return ParameterSearch.findByIdAndUpdate(req.body._id, {name: req.body.name})
    .exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function getSimRuns(req, res) {
  return SimulationRun.find({ '_id': { $in: req.body } })
    .select("-results")
    .exec()
    .then(handleEntityNotFound(res))
    .catch(handleError(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function getSimRunsWithResults(req, res) {
  return SimulationRun.find({ '_id': { $in: req.body } })
    .exec()
    .then(handleEntityNotFound(res))
    .catch(handleError(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function getImage(req, res) {
  gfs.exist({ _id: req.params.id }, function (err, found) {
    if (err) return handleError(err);
    found
      ? gfs.createReadStream({ _id: req.params.id }).pipe(res)
      : console.log("File does not exist");
  });
}

// Gets the configuration
export function getConfiguration(req, res) {
  return Configuration.find()
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a list of ParameterSearches
export function paramSearchList(req, res) {
  return ParameterSearch.find()
    .select("-simulation_runs.results")
    .exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a full ParameterSearch
export function paramSearch(req, res) {
  return ParameterSearch.findById(req.params.id)
    .select("-simulation_runs.results.parameters")
    .populate("simulation_runs.results.figure")
    .exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export async function deleteSimRun(req, res) {
  await SimulationRun.deleteOne({ _id: req.params.id })
    .exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export async function deleteParamSearch(req, res) {
  var paramSearches = await ParameterSearch.findByIdAndRemove({ _id: req.params.id })
    .exec()
    .then(handleEntityNotFound(res))
    .catch(handleError(res));

  await SimulationRun.deleteMany({ _id: { $in: paramSearches.simulation_runs } })
    .exec()
    .then(handleEntityNotFound(res))
    .catch(handleError(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function insertSimrunsToDb(req, res) {
  if (!req.body.file_name) {
    res.status(400).send("No file name provided");
    return;
  }

  axios({
    method: "post",
    url: "http://localhost:8213/insertRepository",
    data: {
      file_name: req.body.file_name,
      paramsearch_name: req.body.paramsearch_name,
    },
  })
    .then(async function (response) {
      if (!req.body.paramsearch_name) {
        SimulationRun.find()
          .select("-results")
          .exec()
          .then(respondWithResult(res))
          .catch(handleError(res));
      } else {
        ParameterSearch.find()
          .select("-simulation_runs.results")
          .exec()
          .then(respondWithResult(res))
          .catch(handleError(res));
      }
    })
    .catch(function (error) {
      console.log(error);
      res.status(400).send(error);
    });
}

export function mergeAndInsertSimrunsToDb(req, res) {
  if (!req.params["file_name1"]) {
    res.send("No file1 name provided");
    return;
  }

  if (!req.params["file_name2"]) {
    res.send("No file2 name provided");
    return;
  }

  axios({
    method: "post",
    url: "http://localhost:8213/mergeAndInsertRepository",
    data: {
      file_name1: req.params["file_name1"],
      file_name2: req.params["file_name2"],
    },
  })
    .then(function (response) {
      res.status(200).send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.status(400).send(error);
    });
}

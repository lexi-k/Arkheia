"use strict";

import mongoose from "mongoose";

var ResultSchema = new mongoose.Schema({
  class_name: String,
  file_name: String,
  figure: { type: mongoose.Schema.Types.Object, ref: "GFS" },
  parameters: Object
});

var SimulationRunSchema = new mongoose.Schema({
  from_parameter_search: Boolean,
  submission_date: String,
  run_date: String,
  parameters: Object,
  results: [ResultSchema],
  simulation_run_name: String,
  model_name: String,
  model_info: String
});

var ParameterSearchSchema = new mongoose.Schema({
  submission_date: String,
  changing_params: String,
  name: String,
  run_date: String,
  model_name: String,
  simulation_runs: [
    { type: mongoose.Schema.Types.ObjectId, ref: SimulationRun }
  ],
  parameter_combinations: Object
});

var ConfigurationSchema = new mongoose.Schema({
  wellcome_message: String,
  description_message: String
});

export var GFS = mongoose.model(
  "GFS",
  new mongoose.Schema({}, { strict: false }),
  "fs.files"
);
export var ParameterSearch = mongoose.model(
  "parameterSearchRun",
  ParameterSearchSchema,
  "parameterSearchRuns"
);
export var Configuration = mongoose.model(
  "configuration",
  ConfigurationSchema,
  "configuration"
);
export var SimulationRun = mongoose.model("submission", SimulationRunSchema);

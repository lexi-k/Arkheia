/**
 * SimulationRun model events
 */

"use strict";

import { EventEmitter } from "events";
import SimulationRun from "./simulation-run.model";
var SimulationRunEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
SimulationRunEvents.setMaxListeners(0);

// Model events
var events = {
  save: "save",
  remove: "remove"
};

// Register the event emitter to the model events
for (var e in events) {
  let event = events[e];
  SimulationRun.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function (doc) {
    SimulationRunEvents.emit(event + ":" + doc._id, doc);
    SimulationRunEvents.emit(event, doc);
  };
}

export default SimulationRunEvents;

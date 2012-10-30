 /*
  * scheduler
  * https://github.com/rwldrn/scheduler
  *
  * Copyright (c) 2012 Rick Waldron
  * Licensed under the MIT license.
  */
var events = require("events"),
    util = require("util"),
    es6 = require("es6-collections"),
    WeakMap = es6.WeakMap,
    exportable, queue, drift, priv;

exportable = {};

// Object containing callback queues, keys are time in MS
queue = {};

// Initial value of time drift
drift = 0;

priv = new WeakMap();

/**
 * Scheduler create a scheduler item
 * @param {Number} ms    Time in ms
 * @param {Object} entry Options for entry {time, task}
 */
function Scheduler( entry ) {
  if ( !(this instanceof Scheduler) )  {
    return new Scheduler( entry );
  }

  this.called = 0;
  this.now = this.calledAt = Date.now();

  priv.set( this, entry );

  // this.time = entry.time;
  // this.type = entry.type;
  // this.task = entry.task;

  entry.isRunnable = true;
  entry.later = this.now + entry.time;


  if ( !queue[ entry.later ] ) {
    queue[ entry.later ] = [];
  }

  queue[ entry.later ].push( this );
}

// Inherit EventEmitter API
util.inherits( Scheduler, events.EventEmitter );

/**
 * Scheduler.deriveOp (reduction)
 * (static)
 */
Scheduler.deriveOp = function( p, v ) {
  return v !== "task" ? v : p;
};


/**
 * stop Stop the current behaviour
 */
Scheduler.prototype.stop = function() {
  priv.get(this).isRunnable = false;
  this.emit("stop");
};




process.nextTick(function tick() {
  process.nextTick( tick );

  var now, entry, entries, schedulerd;

  // Store entry stack key
  now = Date.now();

  // Derive entries stack from queue
  entries = queue[ now ] || [];

  if ( entries.length ) {
    // console.log( entries );
    while ( entries.length ) {
      // Shift the entry out of the current list
      schedulerd = entries.shift();
      entry = priv.get( schedulerd );


      // Execute the entry's callback, with
      // "entry" as first arg
      if ( entry.isRunnable ) {
        schedulerd.called++;
        schedulerd.calledAt = now;
        entry.task.call( schedulerd, schedulerd );
      }

      // Additional "loop" handling
      if ( entry.type === "loop" && entry.isRunnable ) {

        // Calculate the next execution time
        entry.later = now + entry.time;

        // Create a queue entry if none exists
        if ( !queue[ entry.later ] ) {
          queue[ entry.later ] = [];
        }

        if ( entry.isRunnable ) {
          // Push the entry into the cue
          queue[ entry.later ].push( schedulerd );
        }
      }
    }

    // Delete the empty queue array
    delete queue[ now ];
  }
});

[ "loop", "wait" ].forEach(function( type ) {

  exportable[ type ] = function( time, task ) {

    if ( typeof time === "function" ) {
      task = time;
      time = 10;
    }

    return new Scheduler({
      time: time,
      type: type,
      task: task
    });
  };
});

function Queue( tasks ) {
  var op, cumulative, item, task, self;

  cumulative = 0;

  self = this;

  while ( tasks.length ) {
    item = tasks.shift();
    op = Object.keys(item).reduce( Scheduler.deriveOp, "" );

    cumulative += item[ op ];

    // For the last task, ensure that an "ended" event is
    // emitted after the final callback is called.
    if ( tasks.length === 0 ) {
      task = item.task;
      item.task = function( schedulerd ) {
        task.call( this, schedulerd );
        self.emit( "ended", schedulerd );
      };
    }

    if ( op === "loop" && tasks.length === 0 ) {
      // When transitioning from a "wait" to a "loop", allow
      // the loop to iterate the amount of time given,
      // but still start at the correct offset.
      exportable.wait( cumulative - item[ op ], function() {
        exportable.loop( item[ op ], item.task );
      });
    } else {
      exportable[ op ]( cumulative, item.task );
    }
  }
};

util.inherits( Queue, events.EventEmitter );

exportable.queue = function( tasks ) {
  return new Queue( tasks );
};

module.exports = exportable;

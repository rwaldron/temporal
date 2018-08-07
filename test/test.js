"use strict";

var temporal = require("../lib/temporal.js");
var Emitter = require("events").EventEmitter;


function sum(a, b) {
  return a + b;
}

function fuzzy(actual, expected, tolerance) {
  tolerance = tolerance || 10;
  return actual === expected ||
    (Math.abs(actual - expected) <= tolerance);
}

function hrNow() {
  let hrtime = process.hrtime();
  return (hrtime[0] * 1e9 + hrtime[1]);
}


exports["temporal"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  emitter: function(test) {
    test.expect(1);
    test.ok(temporal instanceof Emitter);
    test.done();
  },
  busy: function(test) {
    test.expect(2);

    temporal.on("busy", function() {
      test.ok(true);
    });

    temporal.wait(1, function() {
      test.ok(true);
      test.done();
    });
  },
  idle: function(test) {
    test.expect(2);

    temporal.on("idle", function() {
      test.ok(true);
      test.done();
    });

    temporal.wait(1, function() {
      test.ok(true);
    });
  }
};

exports["context"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  loop: function(test) {
    test.expect(1);

    temporal.loop(200, function(context) {

      test.ok(context === this);

      if (context.called === 1) {
        this.stop();
        test.done();
      }
    });
  }
};

exports["clear"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  clear: function(test) {
    test.expect(1);

    temporal.wait(20, function() {
      // this will never happen.
      console.log("shouldn't happen");
      test.ok(false);
    });

    temporal.wait(10, function() {
      console.log("kill it");
    });

    setTimeout(function() {
      temporal.clear();
      test.ok(true);
      test.done();
    }, 1);
  }
};

exports["loops"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  stop: function(test) {
    test.expect(1);

    var temporaldAt, completeds, last;

    temporaldAt = hrNow();

    completeds = [];

    temporal.loop(100, function(loop) {
      // console.log( "a", a );
      if (loop.called === 1) {
        completeds.push(loop.called);
        this.stop();
      }
    });

    temporal.loop(100, function(loop) {
      // console.log( "b", b );
      if (loop.called === 3) {
        completeds.push(loop.called);
        this.stop();
      }
    });

    last = temporal.loop(100, function(loop) {
      // console.log( "c", c );
      if (loop.called === 5) {
        completeds.push(loop.called);
        loop.stop();
      }
    });


    last.on("stop", function() {
      var result = completeds.reduce(sum, 0);
      test.equal(result, 9, "sum of loop.called counters is 9");
      test.done();
    });
  }
};

exports["delay"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  delay: function(test) {
    test.expect(13);

    var completed = 0;
    var times = [
      1, 2, 5, 10, 20, 50, 100, 150, 200, 250, 500, 750, 1000
    ];

    times.forEach(function(time) {

      var temporaldAt = hrNow(),
        expectAt = temporaldAt + time * 1e6;

      temporal.delay(time, function() {
        var actual = hrNow();

        test.ok(
          fuzzy(actual, expectAt, 10 * 1e6),
          "time: " + time + " ( " + Math.abs(actual - expectAt) + ")"
        );

        if (++completed === times.length) {
          test.done();
        }
        // console.log(completed, time);
      });
    });
  },
  order: function(test) {
    // If temporal does not allow delays to be enqueud
    // "out of order", test.done() will never be hit
    test.expect(2);
    temporal.delay(10, () => {
      test.ok(true, "10 ms delay called");
      test.done();
    });
    temporal.delay(5, () => {
      test.ok(true, "5 ms delay called");
    });
  }
};

exports["repeat"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  repeat: function(test) {
    test.expect(1);

    var completed = 0;

    temporal.repeat(2, 500, function() {
      if (++completed === 2) {
        test.ok(true, "repeat called twice");
        test.done();
      }
    });
  },
  returns: function(test) {
    test.expect(5);

    var repeat = temporal.repeat(2, 500, function() {});

    test.ok(repeat);
    test.ok(repeat.stop);
    test.ok(repeat.calledAt);
    test.ok(repeat.now);
    test.equal(repeat.called, 0);

    test.done();
  }
};


exports["queue"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  speed: function(test) {
    test.expect(4);

    var temporaldAt = hrNow(),
      expectAt = temporaldAt + 1e6;

    // Wait queue
    temporal.queue([{
      delay: 1,
      task: function() {
        var now = hrNow();
        test.ok(fuzzy(now, expectAt, 1e6), "queued fn 1: on time");
        expectAt = now + 2 * 1e6;
      }
    }, {
      delay: 2,
      task: function() {
        var now = hrNow();
        test.ok(fuzzy(now, expectAt, 1e6), "queued fn 1: on time");
        expectAt = now + 5 * 1e6;
      }
    }, {
      delay: 5,
      task: function() {
        var now = hrNow();
        test.ok(fuzzy(now, expectAt, 1e6), "queued fn 2: on time");
        test.ok(fuzzy(now, temporaldAt + 8 * 1e6, 2 * 1e6), "queue lapse correct");

        test.done();
      }
    }]);
  },
  hundredms: function(test) {
    test.expect(100);

    var queue = [];
    var k = 0;

    for (let i = 0; i < 100; i++) {
      queue.push({
        delay: 1,
        task: function() {
          var now = hrNow();
          test.ok(fuzzy(now, expectAt, 1 * 1e9), "queued fn " + k + ": on time");
          expectAt = now + 1 * 1e9;
        }
      });

      k++;
    }

    var temporaldAt = hrNow();
    var expectAt = temporaldAt + 1 * 1e9;


    temporal.on("idle", function() {
      temporal.clear();
      test.done();
    });

    temporal.queue(queue);
  },
  hundredfps: function(test) {
    test.expect(100);

    var queue = [];

    for (let i = 0; i < 100; i++) {
      queue.push({
        delay: 10,
        task: function() {
          temporaldAt = hrNow();
          test.ok(fuzzy(temporaldAt, expectAt, 2 * 1e6), "queued fn: on time");
          expectAt = temporaldAt + 10 * 1e6;
        }
      });

    }

    var temporaldAt = hrNow();
    //var startedAt = hrNow();
    var expectAt = temporaldAt + 10 * 1e6;

    temporal.on("idle", function() {
      //test.ok(fuzzy(temporaldAt - startedAt, 1000 * 1e6, 2 * 1e6), "~1000ms " + (temporaldAt - startedAt));
      temporal.clear();
      test.done();
    });
    // Wait queue
    temporal.queue(queue);

  },

  delay: function(test) {
    test.expect(3);

    var temporaldAt = hrNow(),
      expectAt = temporaldAt + 100 * 1e6;

    // Wait queue
    temporal.queue([{
      delay: 100,
      task: function() {
        var now = hrNow();

        test.ok(fuzzy(now, expectAt, 1e6), "queued fn 1: on time");
        expectAt = now + 200 * 1e6;
      }
    }, {
      delay: 200,
      task: function() {
        var now = hrNow();

        test.ok(fuzzy(now, expectAt, 1e6), "queued fn 2: on time");
        test.ok(fuzzy(now, temporaldAt + 300 * 1e6, 1e6), "queue lapse correct");

        test.done();
      }
    }]);
  },
  loop: function(test) {
    test.expect(6);

    var temporaldAt = hrNow(),
      expectAt = temporaldAt + 100 * 1e6;

    // Wait queue
    temporal.queue([{
      delay: 100,
      task: function() {
        var now = hrNow();

        test.ok(fuzzy(now, expectAt, 1e6), "queued delay fn 1: on time (" + now + ", " + expectAt + ")");
        expectAt = now + 200 * 1e6;
      }
    }, {
      loop: 200,
      task: function(task) {
        var now = hrNow();

        if (task.called === 1) {
          test.ok(fuzzy(now, expectAt, 1e6), "queued loop fn 1: on time (" + now + ", " + expectAt + ")");
          test.ok(fuzzy(now, temporaldAt + 300 * 1e6, 1e6), "queue lapse correct");
        }

        if (task.called === 2) {
          test.ok("stop" in task);
          test.ok(fuzzy(now, expectAt, 1e6), "queued loop fn 2: on time (" + now + ", " + expectAt + ")");
          test.ok(fuzzy(now, temporaldAt + 500 * 1e6, 1e6), "queue lapse correct");
          test.done();
        }

        expectAt = now + 200 * 1e6;
      }
    }]);
  },
  end: function(test) {
    test.expect(3);

    var queue;

    // Wait queue
    queue = temporal.queue([{
      delay: 100,
      task: function() {
        test.ok(true);
      }
    }, {
      delay: 100,
      task: function() {
        test.ok(true);
      }
    }]);

    queue.on("end", function() {
      test.ok(true);
      test.done();
    });
  },
  stop: function(test) {
    test.expect(1);

    var queue = temporal.queue([{
      delay: 50,
      task: function() {
        test.ok(false);
      }
    }, {
      delay: 50,
      task: function() {
        test.ok(false);
      }
    }, {
      delay: 50,
      task: function() {
        test.ok(false);
      }
    }]);

    // Stop before any tasks run.
    setTimeout(function() {
      queue.stop();
    }, 10);

    queue.on("stop", function() {
      test.ok(true);
      test.done();
    });
  }
};

exports["failsafe"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  missed: function(test) {
    test.expect(3);

    // The previousTick patch ensures that all
    // three of these tasks are run.

    temporal.queue([{
      wait: 50,
      task: function() {
        test.ok(true);

        var blocking = hrNow() + 30 * 1e6;

        while (hrNow() < blocking) {}
      }
    }, {
      wait: 10,
      task: function() {
        // console.log(2);
        test.ok(true);
      }
    }, {
      wait: 30,
      task: function() {
        // console.log(3);
        test.ok(true);
        test.done();
      }
    }]);
  }
};

exports["Res_0.1"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  delay: function(test) {
    test.expect(8);

    temporal.resolution(0.1);

    var completed = 0;
    var times = [
      1.5, 2.0, 2.5, 3.3, 5.0, 7.5, 10.0, 11.2
    ];

    times.forEach(function(time) {

      var temporaldAt = hrNow(),
        expectAt = temporaldAt + time * 1e6;

      temporal.delay(time, function() {
        var actual = hrNow();

        test.ok(
          fuzzy(actual, expectAt, 10 * 1e6),
          "time: " + time + " ( " + Math.abs(actual - expectAt) + ")"
        );

        if (++completed === times.length) {
          test.done();
        }
        // console.log(completed, time);
      });
    });
  }
};

exports["Res_0.01"] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done) {
    temporal.clear();
    done();
  },
  delay: function(test) {
    test.expect(8);

    temporal.resolution(0.01);

    var completed = 0;
    var times = [
      1.50, 2.00, 2.50, 3.33, 5.00, 7.50, 10.00, 11.2
    ];

    times.forEach(function(time) {

      var temporaldAt = hrNow(),
        expectAt = temporaldAt + (time * 1e6);

      temporal.delay(time, function() {
        var actual = hrNow();

        test.ok(
          fuzzy(actual, expectAt, 1 * 1e6),
          "time: " + time + " (" + (actual - expectAt) + ")"
        );

        if (++completed === times.length) {
          test.done();
        }

      });
    });
  }
};

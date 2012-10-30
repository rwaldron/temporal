# schedule

Non-blocking, temporal task sequencing. [EmpireJS Presentation](https://dl.dropbox.com/u/3531958/empirejs/)

Note: `schedule` does NOT use `setTimeout` or `setInterval`

## Getting Started

```bash
npm install schedule
```


## Examples

```javascript
var schedule = require('schedule');

// Wait n milliseconds, execute a task
schedule.wait( 500, function() {

  console.log( "500ms later..." );

});

// Loop every n milliseconds, executing a task each time
schedule.loop( 500, function( loop ) {

  console.log( "Every 500ms..." );

  // `loop` is a reference to the schedule instance
  // use it to cancel the loop by calling:
  //
  loop.stop();

  // The number of times this loop has been executed:
  loop.called; // number

});

// Queue a sequence of tasks: wait, wait
// Each wait time is added to the prior wait times.
schedule.queue([
  {
    wait: 500,
    task: function() {
      // Executes 500ms after schedule.queue(...) is called
    }
  },
  {
    wait: 500,
    task: function() {
      // Executes 1000ms after schedule.queue(...) is called

      // The last "wait" task will emit an "ended" event
    }
  }
]);

// Queue a sequence of tasks: wait then loop
// Each wait time is added to the prior wait times.
schedule.queue([
  {
    wait: 500,
    task: function() {
      // Executes 500ms after schedule.queue(...) is called
    }
  },
  {
    loop: 100,
    task: function() {
      // Executes 600ms after schedule.queue(...) is called

      // Executes every 100ms thereafter.
    }
  }
]);
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/gruntjs/grunt).

## License
Copyright (c) 2012 Rick Waldron
Licensed under the MIT license.

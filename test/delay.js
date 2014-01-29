var temporal = require("../lib/temporal"),
	repl = require("repl"),
	then = Date.now(),
	i, delay = 0;

var queue = temporal.queue([]);

repl.start("> ").context.queue = queue;

for(i = 1; i <= 5; i++) {
	queue.add([{
		delay: delay,
		task: function() {
			console.log(Date.now()-then, "later...");
			then = Date.now();
		}
	}]);

	delay = 500 + (i*10);
}

setTimeout(function() {
	delay = 500;
	then = Date.now();

	for(i = 1; i <= 5; i++) {
		queue.add([{
			delay: delay,
			task: function() {
				console.log(Date.now()-then, "later...");
				then = Date.now();
			}
		}]);

		delay = 500 + (i*10);
	}
}, 3000);

// setTimeout(function() {
// 	queue.stop();
// }, 6000);
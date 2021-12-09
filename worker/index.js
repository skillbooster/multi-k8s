const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  // if redisClient will ever lose the connection
  // to the redisServer it should try to
  // re-connect every 1000ms
  retry_strategy: () => 1000
});

// if there is a redisClient that publishes
// or listens information on redis
// we have to make a duplicate connection
// because when connection is turned into
// connection that is going to listen, subscribe
// or publish information it cannot be used
// for other purposes, thus duplicating
// the connection
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// every time we get "message" run callback
sub.on('message', (channel, message_payload) => {
  // set key "message_payload" (fib index)
  // with value fib(parseInt(message_payload))
  // into hash called "values"
  redisClient.hset(
    'values', message_payload, fib(parseInt(message_payload)));
});

// subscribe to any 'insert' event
// every time value is being added into redis
// we are going to calculate fib and toss that
// value back into the redis instance
sub.subscribe('insert');
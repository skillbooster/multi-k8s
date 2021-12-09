const keys = require('./keys');

// Express App Setup
const express = require('express');
// const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json())
// app.use(bodyParser.json());


// Postgres setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});
pgClient.on('error', () => {
  console.log('Lost PG connection');
});

// create table in pg DB with name 'values'
// and single column of information 'number'
// indexes of submited values
pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));

// REDIS Client setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi');
});

// route to get data from PG DB
app.get('/values/all', async (req, res) => {
  const values = await pgClient
    .query('SELECT * from values');
  // rows - sending just data no additional
  // information, like aboyt the query itself
  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  // look at hash value 'values' and get all
  // information from it
  redisClient.hgetall('values', (err, values) => {
    // redis doesn't operate on promises
    // so we need to use callback
    res.send(values);
  });
});

app.post('/values', async(req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  // not calculated yet, job will be sent
  // to the worker and he will update the
  // 'index' value
  redisClient.hset('values', index, 'Nothing yet');
  // triggering the worker which awaits for
  // 'insert' events
  redisPublisher.publish('insert', index);
  // saving the index in PG DB
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening....');
})

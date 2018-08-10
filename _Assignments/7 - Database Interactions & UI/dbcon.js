let express = require('express');
let bodyParser = require('body-parser');
let mysql = require('mysql');
let pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'workouts'
});

// Generate Initial Table within the 'workouts' database
pool.query("DROP TABLE IF EXISTS todo", function() {
    let createString = "CREATE TABLE todo(" +
        "id INT PRIMARY KEY AUTO_INCREMENT," +
        "name VARCHAR(255) NOT NULL," +
        "rep INT," +
        "weight INT," +
        "units BOOLEAN," +
        "date DATE)";
    pool.query(createString, function(error) {
        if (error) {
            console.log(error);
        }
        console.log("Todo Table Created");
    });
});

let app = express();
let handlebars = require('express-handlebars').create({defaultLayout: 'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 4000);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', function(req, res){
    res.render('form');
});

app.get('/tasks', function(req, res) {
    let context = {};
    if (!req.query.id) {
        pool.query('SELECT * FROM todo', function(error, rows) {
            if (error) {
                console.log(error);
                return;
            }
            context.results = JSON.stringify(rows);
            res.send(context);
        });
    } else {
        pool.query('SELECT * FROM todo WHERE id = ' + req.query.id, function(error, rows) {
            if (error) {
                console.log(error);
                return;
            }
            context.results = JSON.stringify(rows);
            res.send(context);
        });
    }
});

app.put('/tasks', function(req, res) {
    let units = req.query.units === 'kg' ? 0 : 1;
    pool.query('UPDATE todo SET name=?, rep=?, weight=?, date=?, units=? WHERE id=? ',
        [req.query.name, req.query.rep, req.query.weight, req.query.date, units, req.query.id], function(error) {
        if (error) {
            console.log(error);
            return;
        }
        res.render('form');
    });
});

app.post('/tasks', function(req, res) {
    let body = req.body;
    let name = body.name === '' ? null : body.name;
    let reps = body.rep;
    let weight = body.weight;
    let date = body.date;
    let units = body.units === 'kg' ? 0 : 1;
    let values = "'" + name + "'," + reps + ',' + weight + ",'" + date + "'," + units;
    pool.query('INSERT INTO todo(name, rep, weight, date, units) VALUES (' + values + ');', function(error, rows) {
        if (error) {
            console.log(error);
            return;
        }
        let data = JSON.stringify(rows);
        res.send(data);
    });
});

app.post('/', function(req, res){
    res.render('form');
});

app.delete('/tasks', function(req, res) {
    let id = req.query.id;
    let context = {};
    pool.query('DELETE FROM todo WHERE id = ' + id, function(error, rows) {
        if (error) {
            next(error);
            return;
        }
        context.results = JSON.stringify(rows);
        res.send(context);
    });
});

app.use(function(req, res){
    res.status(404);
    res.render('404');
});

app.use(function(error, req, res){
    console.log(error.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function(){
    console.log('Express started on port ' + app.get('port'));
});
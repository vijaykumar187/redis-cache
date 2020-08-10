const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// SET response

function setResponse(username,repos){

    return `<h2>${username} has ${repos} Github repos !!! </h2>`;
}
// Make request for GITHUB data

async function getRepos(req,res,next){

    try{
        console.log(`fetching Data.....`);

        const { username } = req.params;

        const response = await fetch(`https://api.github.com/users/${username}`);

        const data = await response.json();

        //res.send(data);

        const repos = data.public_repos;

        client.setex(username, 3600 , repos);

        res.send(setResponse(username,repos));

    } catch(err){

        console.log(err);
        res.status(500);
    }

}

// Cache middleware

function cache(req, res,next){

    const { username } = req.params;

    client.get(username, (err,data) => {

        if(err) throw err;

        if(data !== null) {

            res.send(setResponse(username,data));
        } else{
            next();
        }
    })
}
app.get('/repos/:username', cache, getRepos);

app.listen(5000,() =>{
    console.log(`App listening on ${PORT}`);
});
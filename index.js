const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// middle wares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uj31i.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    console.log(req.headers);
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized ' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_WEB_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized ' })
        }
        req.decoded = decoded;
        next();


    });
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");


        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('service');
        const newGeniurCarCollection = client.db("newGeniusCar").collection("services");

        const orderCollection = client.db("newGeniusCar").collection("orders");

        app.get('/services', async (req, res) => {
            console.log("services loaded");
            const query = {};
            const cursor = newGeniurCarCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        //
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_WEB_TOKEN, { expiresIn: '1h' })
            res.send({ token })


        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            const service = await newGeniurCarCollection.findOne(query)
            console.log(service);
            res.send(service)
        });

        // orders api
        app.post('/orders', async (req, res) => {
            const data = req.body;
            // const doc = { data: data }
            const result = await orderCollection.insertOne(data);
            res.send(result)
            console.log("data inserted");
            console.log(result);

        })


        app.get('/orders', verifyJWT, async (req, res) => {

            // const decoded = req.decoded;
            // console.log(decoded);
            // if (decoded.email !== req.query.email) {
            //     res.status(403).send({ message: 'unauthorized access!!' })
            // }

            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })


        app.get('/orders/:email', verifyJWT, async (req, res) => {

            const userEmail = req.params.email;

            const query = { email: userEmail }
            console.log(query);
            const orders = orderCollection.find(query)
            const result = await orders.toArray()
            res.send(result)

        })




        // app.get('/orders', verifyJWT, async (req, res) => {
        //     const decoded = req.decoded;
        //     console.log("inside the orders api", decoded);


        //     const query = {};
        //     const cursor = orderCollection.find(query);
        //     const services = await cursor.toArray();
        //     res.send(services);

        // })



        //delete orders

        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const deletedResult = await orderCollection.deleteOne(query)
            res.send(deletedResult)
            console.log("deleted successfully!!!!!");
        })


        // update orders
        app.patch('/order', async (req, res) => {
            // const id = req.params.id;

            // const query = { _id: new ObjectId(id) }
            const query = {}
            const value = req.body.status
            const updateDoc = {
                $set: {
                    status: value
                },
            };

            const result = await orderCollection.updateMany(query, updateDoc)
            res.send(result)
            console.log("updated in line 104", updateDoc);
        })

        app.put('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            // const query = {}
            // // const query = { email: "ancle@gmail.com" }
            const value = req.body.status
            console.log(value);
            // const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: value
                },
            };

            // console.log("update doc done111");
            const result = await orderCollection.updateOne(query, updateDoc)
            console.log("updated in line 104");
            res.send(result)
        })








    } finally {


        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}


run().catch(err => console.error(err));





app.get('/', (req, res) => {
    res.send('Hello World  form new genius car server!!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
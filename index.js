const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config();
const uri = process.env.MONGO_URI;


const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async(req, res, next) => {
        const authHeader =req?.headers.authorization;
        if (!authHeader) {
            return res.status(401).send({ message: "Unauthorized Access" });
        }
        const token = authHeader?.split(" ")[1];
        if(!token) {
            return res.status(401).send({ message: "Unauthorized Access" });
        }

        try {
            const {payload} = await jwtVerify(token, JWKS)
        next();
        } catch (error) {
            return res.status(403).send({ message: "Forbidden" });
        }
            
        

    }

async function run() {
  try {
    // await client.connect();

    const db = client.db("wanderlust");
    const destinationCollection = db.collection("destinations");
    const bookingCollection = db.collection("bookings");


    app.post("/destinations",verifyToken, async (req, res) => {
        const newDestination = req.body;
        console.log(newDestination);
        const result = await destinationCollection.insertOne(newDestination);
        res.send(result);
    });

    app.get("/destinations", async (req, res) => {
        const cursor = destinationCollection.find({});
        const result = await cursor.toArray();
        res.send(result);
    });
    // Secure route with middleware
    app.get("/destinations/:id",verifyToken, async (req, res) => {
        const {id} = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await destinationCollection.findOne(query);
        res.send(result);
    });
    app.patch("/destinations/:id",verifyToken, async (req, res) => {
        const {id} = req.params;
        const updatedDestination = req.body;

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: updatedDestination,
        };
        const result = await destinationCollection.updateOne(query, updateDoc);
        res.send(result);
    });
    app.delete("/destinations/:id",verifyToken, async (req, res) => {
        const {id} = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await destinationCollection.deleteOne(query);
        res.send(result);
    });

    app.post("/bookings",verifyToken, async (req, res) => {
        const newBooking = req.body;
        const result = await bookingCollection.insertOne(newBooking);
        res.send(result);
    });

    app.get("/bookings/:userId",verifyToken, async (req, res) => {
      const {userId} = req.params;
      const query = { userId: userId };
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    app.delete("/bookings/:userId",verifyToken, async (req, res) => {
      const {userId} = req.params;
      const query = { _id: new ObjectId(userId) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Server is running Fine!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
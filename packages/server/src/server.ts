import dotenv from "dotenv"
import http from "http"
import express, {Express, NextFunction, Response, Request} from "express"
import bodyParser from "body-parser"
import cors from "cors"
import { dbConnection, pgp } from "./DbConnection.js"
import { initializeCommons } from "@lionweb/repository-common"
import { registerDBAdmin } from "@lionweb/repository-dbadmin"
import { registerInspection } from "@lionweb/repository-inspection"
import { registerBulkApi } from "@lionweb/repository-bulkapi"
import { registerAdditionalApi } from "@lionweb/repository-additionalapi"
import { registerLanguagesApi } from "@lionweb/repository-languages"
import { HttpClientErrors } from "@lionweb/repository-common"
import { unlink, appendFile } from 'node:fs/promises';
//import { responseTime } from "response-time"

// import pkg from 'response-time';
// const { responseTime } = pkg;


dotenv.config()

export const app: Express = express()

// app.use(responseTime.responseTime(function (req, res, time) {
//     console.log(`response time ${time}`)
// }))

const getDurationInMilliseconds = (start) => {
    const NS_PER_SEC = 1e9
    const NS_TO_MS = 1e6
    const diff = process.hrtime(start)

    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
}

const getDurationInMillisecondsDiff = (start, end) => {
    const NS_PER_SEC = 1e9
    const NS_TO_MS = 1e6
    const diff = [end[0]-start[0], end[1]-start[1]]

    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
}

let measurements: number[] = []

function printMeasurements() {
    let sum = 0
    measurements.forEach((m)=>sum+=m)
    console.log(`   n measurements: ${measurements.length}, total: ${sum}, average: ${sum/measurements.length}`)
}

await unlink('performancelog.csv').catch(() => void 0)
await appendFile('performancelog.csv', 'nnodes,time,start_processing,validation_completed,result_calculated,response_preparation_1,response_preparation_2,response_preparation_3,response_preparation_4,response_prepared,end_processing\n')

class Track {
    public name:string;
    public timeFromStart: number;
    public trackTime: number;
}

class TimeTracker {
    public start: [number, number];
    lastMilestone: [number, number];
    public tracks : Track[] = [];
    constructor() {
        this.start = process.hrtime();
        this.lastMilestone = this.start;
    }
    milestone(name: string) {
        let t = new Track();
        let time = process.hrtime();
        t.name = name;
        t.timeFromStart = getDurationInMillisecondsDiff(this.start, time);
        t.trackTime = getDurationInMillisecondsDiff(this.lastMilestone, time);
        this.tracks.push(t);
        this.lastMilestone = time;
    }
}

app.use((req, res, next) => {
    //console.log(`${req.method} ${req.originalUrl} [STARTED]`)
    //const start = process.hrtime()
    const timeTracker = new TimeTracker();
    req["timeTracker"] = timeTracker;

    res.on('finish', async () => {
        const durationInMilliseconds = getDurationInMilliseconds (timeTracker.start)
        if (req.originalUrl == "/bulk/store") {
            console.log(`    ${req.method} ${req.originalUrl} [FINISHED] ${durationInMilliseconds.toLocaleString()} ms`)
            measurements.push(durationInMilliseconds)
            printMeasurements()
            await appendFile('performancelog.csv', `${req["nnodes"]},${durationInMilliseconds},${timeTracker.tracks.map((track)=>track.trackTime).join(",")}\n`)
        }

    })

    res.on('close', () => {
        const durationInMilliseconds = getDurationInMilliseconds (timeTracker.start)
            //console.log(`    ${req.method} ${req.originalUrl} [CLOSED] ${durationInMilliseconds.toLocaleString()} ms`)
    })

    next()
})


// Allow access,
// ERROR Access to XMLHttpRequest from origin has been blocked by CORS policy:
// Response to preflight request doesn't pass access control check:
// No 'Access-Control-Allow-Origin' header is present on the request
// const cors = require('cors');
app.use(
    cors({
        origin: "*",
    }),
)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: process.env.BODY_LIMIT || '50mb'}))

const expectedToken = process.env.EXPECTED_TOKEN

function verifyToken(request: Request, response: Response, next: NextFunction) {
    if (expectedToken != null) {
        const providedToken = request.headers['authorization']
        if (providedToken == null || typeof providedToken !== "string" || providedToken.trim() != expectedToken) {
            return response.status(HttpClientErrors.Unauthorized).send("Invalid token or no token provided")
        } else {
            next();
        }
    } else {
        next()
    }
}

app.use(verifyToken)

// Must be first to initialize
initializeCommons(pgp)
registerDBAdmin(app, dbConnection, pgp)
registerBulkApi(app, dbConnection, pgp)
registerInspection(app, dbConnection, pgp)
registerAdditionalApi(app, dbConnection, pgp)
registerLanguagesApi(app, dbConnection, pgp)

const httpServer = http.createServer(app)

const serverPort = parseInt(process.env.NODE_PORT || "3005")

httpServer.listen(serverPort, () => {
    console.log(`Server is running at port ${serverPort} =========================================================`)
    if (expectedToken == null) {
        console.log("WARNING! The server is not protected by a token. It can be accessed freely. " +
            "If that is NOT your intention act accordingly.")
    } else if (expectedToken.length < 24) {
        console.log("WARNING! The used token is quite short. Consider using a token of 24 characters or more.")
    }
})

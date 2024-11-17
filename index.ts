import * as path from 'path';
import * as express from 'express';
import { HumanMessage, isAIMessage } from '@langchain/core/messages';
import { graph, generateImage } from './graph';

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, 'public')));

//generateImage()

let thread_id

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post("/api/stream", (req, res) => {
    const data = req.body;
    const { json } = data
    console.log(json)

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.write(json);
    res.end();
})

app.post("/api/accept", async (req, res) => {

    const config = { configurable: { thread_id } }

    await graph.updateState(config, { purchaseConfirmed: true })

    const stream = await graph.stream(null, config)

    let answer
    let info = []

    try {
        for await (const event of stream) {
            console.log("---START INFO---")
            console.log(JSON.stringify(event, null, 2))
            console.log("---END INFO---")

            info.push(event)

            const nodeName = Object.keys(event)[0]
            const message = event[nodeName].messages
            if (message && !Array.isArray(message) && isAIMessage(message)) {
                answer = message.content
            }

            if (Array.isArray(message) && message.length > 0) {
                answer = message[0].content
            }
        }

        console.log("FINAL ANSWER", answer)

        res.json({ answer, info })
    } catch (error: any) {
        console.log("Error:", error)
        res
            .status(500)
            .json({ message: error.message })
    }
})

app.post("/api/threadId", (req, res) => {
    const data = req.body;
    const { threadId } = data
    thread_id = threadId

    res.json({
        threadId
    })
})

app.post("/api/query", async (req, res) => {
    const data = req.body;
    const { question } = data

    const inputs = new HumanMessage(question)
    const config = { configurable: { thread_id } }

    const stream = await graph.stream({ messages: [inputs] }, config)

    let answer
    let interrupts = false
    let info = []

    try {
        for await (const event of stream) {
            console.log("---START INFO---")
            console.log(JSON.stringify(event, null, 2))
            console.log("---END INFO---")

            info.push(event)

            const nodeName = Object.keys(event)[0]
            const message = event[nodeName].messages
            if (message && !Array.isArray(message) && isAIMessage(message)) {
                answer = message.content
            }
        }

        console.log("FINAL ANSWER", answer)

        const state = await graph.getState(config);
        const tasks = state.tasks

        if (tasks && tasks.length > 0) {
            if (tasks[0].interrupts && tasks[0].interrupts.length > 0) {
                interrupts = true
                answer = tasks[0].interrupts[0].value
            }

            console.log("TASKS", tasks)
        }

        res.json({ answer, info, interrupts })
    } catch (error: any) {
        console.log("Error:", error)
        res
            .status(500)
            .json({ message: error.message })
    }

})

const port = 3000
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})
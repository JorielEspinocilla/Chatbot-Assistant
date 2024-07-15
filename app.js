const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const os = require("os");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const rateLimit = require("express-rate-limit");  
dotenv.config();  

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  
});
app.use(cors());
app.use(bodyParser.json());

// Define the rate limit rules
const limiter = rateLimit({
  windowMs: process.env.WINDOWS_MS, 
  max: process.env.MAX_REQ, 
  message: "Too many requests from this IP, please try again after a minute.",
});

// Apply the rate limit to all requests
app.use(limiter);

(async () => {
  const assistant = await openai.beta.assistants.retrieve(
    process.env.OPENAI_ASSISTANT_ID  
  );
  console.log(assistant);
  app.get("/start", async (req, res) => {
    const thread = await openai.beta.threads.create();
    return res.json({ thread_id: thread.id });
  });
  app.post("/chat", async (req, res) => {
    const assistantId = assistant.id;
    const threadId = req.body.thread_id;
    const message = req.body.message;
    if (!threadId) {
      return res.status(400).json({ error: "Missing thread_id" });
    }
    console.log(`Received message: ${message} for thread ID: ${threadId}`);
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
      max_tokens: process.env.MAX_TOKENS,  
    });
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const response = messages.data[0].content[0].text.value;
    return res.json({ response });
  });
  app.listen(8080, () => {
    const hostname = os.hostname();
    console.log(`Server running on http://${hostname}:8080`);
  });
})();

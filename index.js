const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const os = require("os");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const OpenAI = require("openai");

dotenv.config();  // Load environment variables

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Use the environment variable for API key
});
app.use(cors());
app.use(bodyParser.json());

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const verifyRecaptcha = async (token) => {
  const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
  });
  const data = await response.json();
  return data.success;
};

(async () => {
  const assistant = await openai.beta.assistants.retrieve(
    process.env.OPENAI_ASSISTANT_ID  // Use the environment variable for Assistant ID
  );
  console.log(assistant);
  
  app.get("/start", async (req, res) => {
    const thread = await openai.beta.threads.create();
    return res.json({ thread_id: thread.id });
  });

  app.post("/chat", async (req, res) => {
    const { message, recaptchaResponse } = req.body;
    if (!message || !recaptchaResponse) {
      return res.status(400).json({ error: "Missing message or recaptcha response" });
    }

    const recaptchaVerified = await verifyRecaptcha(recaptchaResponse);
    if (!recaptchaVerified) {
      return res.status(400).json({ error: "Failed reCAPTCHA verification" });
    }

    const assistantId = assistant.id;
    const threadId = req.body.thread_id;
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
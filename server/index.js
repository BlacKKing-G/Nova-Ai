import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "NOVA AI",
  },
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "No conversation was provided.",
      });
    }

    const formattedMessages = [
      {
        role: "system",
        content:
          "You are NOVA AI, a helpful, friendly, intelligent general-purpose AI assistant. Give clear, useful and accurate answers.",
      },
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      })),
    ];

    const completion = await client.chat.completions.create({
      model: "openrouter/free",
      messages: formattedMessages,
    });

    const reply = completion.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("OpenRouter returned an empty response.");
    }

    res.json({
      reply,
    });
  } catch (error) {
    console.error("OpenRouter error:", error);

    res.status(500).json({
      error:
        error?.message ||
        "NOVA could not get a response from OpenRouter.",
    });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`NOVA AI server running on http://localhost:${PORT}`);
});
import { Router } from "express";
import { autharication } from "../middleware/auth.middleware.js";
import { passUserMiddleware } from "../model/middleware/cart.middleware.js";
import { authrazation } from "../middleware/auth.middleware.js";
import { customerTools, adminTools } from "../service/chat/tools.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeTool } from "../service/chat/toolExecuter.js";

const chatRouter = Router({ mergeParams: true });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CUSTOMER_SYSTEM = `You are a helpful shopping assistant for our e-commerce store.
You help customers find products, track orders, and answer questions.
Be friendly, concise, and always use the available tools to fetch real data.
Never make up product details or order statuses — always query the tools.`;

const ADMIN_SYSTEM = `You are an intelligent admin assistant for an e-commerce dashboard.
You help admins analyze sales, manage inventory, update products, and review orders.
Always use tools to fetch real data. For destructive actions (like updating prices),
confirm the action clearly in your response after completing it.`;

// POST /api/chat/customer
chatRouter.post(
  "/customer",
  autharication,
  passUserMiddleware,
  async (req, res) => {
    const { messages } = req.body; // full conversation history from frontend
    const userId = req.body.userId;

    try {
      const response = await runAgentLoop({
        systemPrompt: CUSTOMER_SYSTEM,
        messages,
        tools: customerTools,
        userId,
        role: "customer",
      });
      res.json({ reply: response });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Chat failed" });
    }
  },
);

// ← add this line
// POST /api/chat/admin
chatRouter.post(
  "/admin",
  autharication,
  passUserMiddleware,
  authrazation("admin"),
  async (req, res) => {
    const { messages } = req.body;
    const userId = req.body.userId;

    try {
      const response = await runAgentLoop({
        systemPrompt: ADMIN_SYSTEM,
        messages,
        tools: adminTools,
        userId,
        role: "admin",
      });
      res.json({ reply: response });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Chat failed" });
    }
  },
);

function toGeminiTools(tools) {
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema, // Gemini accepts JSON Schema directly
      })),
    },
  ];
}

function toGeminiHistory(messages) {
  return messages
    .filter((m) => {
      // Remove any messages with empty or invalid content
      if (!m.content) return false;
      if (typeof m.content === "string" && m.content.trim() === "")
        return false;
      return true;
    })
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [
        {
          text:
            typeof m.content === "string"
              ? m.content
              : Array.isArray(m.content)
                ? m.content.map((c) => c.text ?? JSON.stringify(c)).join(" ")
                : JSON.stringify(m.content),
        },
      ],
    }));
}

async function runAgentLoop({ systemPrompt, messages, tools, userId, role }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
    tools: toGeminiTools(tools),
    toolConfig: {
      functionCallingConfig: {
        mode: "AUTO",
      },
    },
  });

  const history = toGeminiHistory(messages.slice(0, -1));
  const lastMessage = messages[messages.length - 1];

  const userText =
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : Array.isArray(lastMessage.content)
        ? lastMessage.content.map((c) => c.text ?? JSON.stringify(c)).join(" ")
        : JSON.stringify(lastMessage.content);

  const chat = model.startChat({ history });
  let result = await chat.sendMessage(userText);

  while (true) {
    const candidate = result.response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0) {
      return result.response.text();
    }

    const functionResponses = await Promise.all(
      functionCalls.map(async (part) => {
        const { name, args } = part.functionCall;
        const toolResult = await executeTool(name, args, userId, role);

        return {
          functionResponse: {
            name,
            response: { result: toolResult }, // Gemini expects { result: ... }
          },
        };
      }),
    );

    result = await chat.sendMessage(functionResponses);
  }
}

export { chatRouter };

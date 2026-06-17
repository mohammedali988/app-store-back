// server/routes/chat.js
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { customerTools, adminTools } from "../service/chat/tools.js";
import { executeTool } from "../service/chat/toolExecuter.js";
import { getCatalogSummary } from "../service/chat/catalogSummary.js";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { passUserMiddleware } from "../model/middleware/cart.middleware.js";

const chatRouter = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CUSTOMER_SYSTEM_BASE = `You are a helpful shopping assistant and personal advisor for our e-commerce store.
You help customers:
- Find products and answer detailed questions about them (price, stock, attributes, descriptions)
- Get personalized advice and recommendations (e.g. "what's the best phone here and why?",
  "I bought a red t-shirt, what pants would go well with it?")
- Track their orders

When giving advice or recommendations, explain your reasoning briefly (price, features, ratings, color match, etc).
Be friendly, concise, and always use the available tools to fetch real data.
Never make up product details, prices, or stock — always query the tools for those.
For general questions that don't need store data, answer directly from your own knowledge.`;

const ADMIN_SYSTEM_BASE = `You are an intelligent admin assistant for an e-commerce dashboard.
You help admins with:
- Detailed product info: stock levels, sales, pricing, attributes — for ANY product, not just low-stock or best-selling
- Order management: find orders by status (pending, processing, shipped, delivered, cancelled), payment status, etc.
- Customer insights: user account status, balance, order history
- Sales analytics and inventory management

Always use tools to fetch real data — never guess numbers.
For destructive actions (like updating prices or order status), confirm the action clearly after completing it.
For general business questions that don't need store data, answer directly.`;

// POST /api/chat/customer
chatRouter.post(
  "/customer",
  autharication,
  passUserMiddleware,
  async (req, res) => {
    const { messages } = req.body;
    const userId = req.userId;

    try {
      const catalogSummary = await getCatalogSummary();
      const systemPrompt = `${CUSTOMER_SYSTEM_BASE}\n\n${catalogSummary}`;

      const { reply, data } = await runAgentLoop({
        systemPrompt,
        messages,
        tools: customerTools,
        userId,
        role: "customer",
      });
      res.json({ reply, data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Chat failed" });
    }
  },
);

// POST /api/chat/admin
chatRouter.post(
  "/admin",
  autharication,
  passUserMiddleware,
  authrazation("admin"),
  async (req, res) => {
    const { messages } = req.body;
    const userId = req.userId;

    try {
      const catalogSummary = await getCatalogSummary();
      const systemPrompt = `${ADMIN_SYSTEM_BASE}\n\n${catalogSummary}`;

      const { reply, data } = await runAgentLoop({
        systemPrompt,
        messages,
        tools: adminTools,
        userId,
        role: "admin",
      });
      res.json({ reply, data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Chat failed" });
    }
  },
);

// Convert our Anthropic-style tool definitions to Gemini format
function toGeminiTools(tools) {
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      })),
    },
  ];
}

// Convert our flat message array to Gemini's { role, parts } format
function toGeminiHistory(messages) {
  return messages
    .filter((m) => {
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

function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => c.text ?? JSON.stringify(c)).join(" ");
  }
  return JSON.stringify(content);
}

async function callGeminiWithRetry(chat, message, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await chat.sendMessage(message);
    } catch (err) {
      const is503 = err.status === 503 || err.message?.includes("503");
      if (is503 && i < retries - 1) {
        console.log(
          `Gemini 503, retrying in ${delayMs}ms... (attempt ${i + 1})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      } else {
        throw err;
      }
    }
  }
}

// Maps tool names → which key in `data` their result should be merged into,
// and how to extract the array from the raw tool result.
const STRUCTURED_DATA_MAP = {
  search_products: { key: "products", extract: (r) => r.products },
  find_matching_products: { key: "products", extract: (r) => r.candidates },
  get_low_stock_products: { key: "products", extract: (r) => r },
  get_orders_by_status: { key: "orders", extract: (r) => r.orders },
  get_pending_orders: { key: "orders", extract: (r) => r },
  get_top_customers: { key: "customers", extract: (r) => r },
  get_user_info: { key: "user", extract: (r) => r },
};

// Agentic loop: Gemini calls functions, we execute them, loop until text response
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
  const userText = extractText(lastMessage.content);

  const chat = model.startChat({ history });
  let result = await callGeminiWithRetry(chat, userText);

  // Collects structured data from tool calls during this turn
  const collectedData = {};

  while (true) {
    const blockReason = result.response.promptFeedback?.blockReason;
    if (blockReason) {
      console.error("Gemini blocked:", blockReason);
      return {
        reply: "I'm sorry, I couldn't process that request.",
        data: collectedData,
      };
    }

    const candidate = result.response.candidates?.[0];
    if (!candidate) {
      console.error(
        "No candidates in response:",
        JSON.stringify(result.response, null, 2),
      );
      return {
        reply: "I'm sorry, I couldn't generate a response.",
        data: collectedData,
      };
    }

    const parts = candidate?.content?.parts ?? [];
    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0) {
      return { reply: result.response.text(), data: collectedData };
    }

    const functionResponses = await Promise.all(
      functionCalls.map(async (part) => {
        const { name, args } = part.functionCall;
        const toolResult = await executeTool(name, args, userId, role);

        // Capture structured data for the frontend, keyed by type
        const mapping = STRUCTURED_DATA_MAP[name];
        if (mapping) {
          const extracted = mapping.extract(toolResult);
          if (extracted) {
            if (Array.isArray(extracted)) {
              collectedData[mapping.key] = [
                ...(collectedData[mapping.key] ?? []),
                ...extracted,
              ];
            } else {
              collectedData[mapping.key] = extracted;
            }
          }
        }

        return {
          functionResponse: {
            name,
            response: { result: toolResult },
          },
        };
      }),
    );

    result = await callGeminiWithRetry(chat, functionResponses);
  }
}

export { chatRouter };

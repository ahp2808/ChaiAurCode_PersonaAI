import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI, {
  APIConnectionTimeoutError,
  RateLimitError,
  AuthenticationError,
  PermissionDeniedError,
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
  InternalServerError,
  APIConnectionError,
  APIError,
} from "openai";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const CHANNELS = {
  chat1: {
    label: "Chat1",
    systemPrompt: `You are Hitesh Sir, who is a well-established person in the world of coding and you have to answer the way he answers.
      Here are some of his characteristics:
      - He is a very good teacher and explains things in a simple way.
      - He is very patient and answers all questions, no matter how many times they are asked.
      - He is very friendly and approachable.
      - He is very knowledgeable and can answer questions on a wide range of topics.
      - He is very encouraging and motivates students to learn more.

      Here are some examples of how he answers questions:
        Q.  Loop engineering kya hai?
        A.  Loop engineering. Haan, are, abhi fancy term hai. 
            Abhi zyada vishwas mat karo in pe. Abhi thoda sa hai fancy. 
            But haan, eventually dheere-dheere aayega in sabke baare mein. 

        Q.  Delhi me meetup kab rakhoge?
        A.  Are bhai, Delhi mein bhi rakh lenge meet up. 
            Par Delhi mein kyun hi rakhenge yaar? Wahan pe hawa paani saaf hota hi nahi hai.
            Issue rehta hai. Jagah ka bhi thoda is pe rehta hai.

        Q.  What are your views on data analyst using Python, then data science? 
        A.  Yaar, I still think data science is good. I'm not sure about data analyst demand 
            — theek-thaak hai, usually rehti hai. But data analyst kitna aur chalega, and 
            kab ye role replace hoga? I don't know, but again bahut saare data analysts shayad 
            khafa ho jaayein is baat ko sunke. But I would say ki yaar, this role is very, very tricky. 
            Kyun mera aisa perspective hai? Kyunki maine jitne bhi data analysts ko dekha hai na, 
            usually unka kaam kya hota hai ki data, web data, sab kuch hai — chalo woh saara aa gaya hai, 
            aapne saari queries, SQL wagairah sab arrange kar liya hai. Now you go and ask your managers 
            ya phir jo stakeholders hote hain, CEOs ho gaye, to unse aap puchte ho ki aapko 
            kaunsa metric chahiye wagerah wagerah.

            Jis hisaab se AI progress kar raha hai, aap data chahe kitni bhi jagah ho, 
            Claude aur Codex ye jitne bhi hain, ye stakeholders ko directly bolte hain ki 
            aap normal English ke andar apni query kar sakte ho. Pooch sakte ho jo bhi aapke 
            liye data important hai, jo bhi metric important hai, aur wo karke de deta hai saara 
            ka saara kaam. To why would anybody need data analyst on low level? High level par to 
            abhi bhi chahiyega. Jo bahut hi zyada extraordinary companies hain unko to chahiyega 
            chahiyega. But I doubt ki how the future will be. Again, koi mujhse zyada better 
            experience hoga wo zyada bata sakta hai.

      `,
  },
  chat2: {
    label: "Chat2",
    systemPrompt:
      `You are Piyush Sir, who is a well-established person in the world of coding and you have to answer the way he answers.
      Here are some of his characteristics:
      - He is a very good teacher and explains things in a simple way.
      - He has good sense of humour and adds jokes in between conversation.
      - He makes jokes on self obsession.
      - He is very knowledgeable and can answer questions on a wide range of topics.
      - He is very encouraging and motivates students to learn more.

      Here are some examples of how he answers questions:
      Q. Current AI era mein design engineering ek achha path hoga start karne ke liye?
      A. Yaar dekho, AI era mein na, tum ek path choose nahi kar sakte, tumhe ultimately 
      har cheez mein master hona padega. Kya tum ek product bana pa rahe ho, wahi matter 
      karta hai. Isse farq nahi padta ki tumhe sirf front end aata hai ya back end aata hai.
      Woh gaya, woh daur chala gaya.
      
      Q. How to improve logical skills? 
      A. Build more, ship more, code more and thoda DSA karo. I think it's
       a habit jo ek ya do din mein to nahi banegi. But when you do it over 
       time to wo logical skills apne aap improve ho jaati hain.
      `,
  },
};

app.post("/api/chat", async (req, res) => {
  const { channel, message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required." });
  }
  const channelConfig = CHANNELS[channel] || CHANNELS.chat1;

  const MESSAGES_DB = [{ role: "system", content: channelConfig.systemPrompt }];
  const apiKey = process.env.GEMINI_API_KEY || '';
  const client = new OpenAI({
    apiKey: `${apiKey}`,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });

  if (!apiKey) {
    return res.json({
      reply: `[${channelConfig.label} channel — demo mode, no GEMINI_API_KEY set]\n\nYou said: "${message}"\n\nAdd your API key to a .env file to get real answers here.`,
    });
  }

  try {
    const messages = [
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message },
    ];
    MESSAGES_DB.push({ role: "user", content: message });
    const result = await client.chat.completions.create({
      model: `${DEFAULT_MODEL}`,
      messages: MESSAGES_DB,
    });

    const response = result.choices[0].message.content;
    if (!response) {
      console.error("Gemini API error");
      return res.status(502).json({ error: "Upstream API error." });
    }

    res.json({ response });
  } catch (err) {
    console.error(err);

    if (err instanceof APIConnectionTimeoutError) {
      return res.status(504).json({
        error:
          "The AI took too long to respond. Try a shorter message, or try again in a moment.",
      });
    }

    if (err instanceof RateLimitError) {
      return res.status(429).json({
        error:
          "We're sending requests too fast right now. Wait a few seconds and try again.",
      });
    }

    if (err instanceof AuthenticationError) {
      return res.status(500).json({
        error:
          "Server configuration problem: the AI API key is missing or invalid.",
      });
    }

    if (err instanceof PermissionDeniedError) {
      return res.status(500).json({
        error:
          "Server configuration problem: this API key does not have permission for this request.",
      });
    }

    if (err instanceof BadRequestError) {
      return res.status(400).json({
        error:
          "That message could not be processed — try rephrasing or shortening it.",
      });
    }

    if (err instanceof NotFoundError) {
      return res.status(500).json({
        error:
          "Server configuration problem: the requested AI model was not found.",
      });
    }

    if (err instanceof UnprocessableEntityError) {
      return res.status(422).json({
        error:
          "The request was understood but could not be processed. Try adjusting your message.",
      });
    }

    if (err instanceof InternalServerError) {
      return res.status(502).json({
        error:
          "The AI provider is having an internal issue right now — it's not something you did. Try again shortly.",
      });
    }

    if (err instanceof APIConnectionError) {
      return res.status(502).json({
        error:
          "Could not reach the AI API. Check your network, firewall, or proxy settings.",
      });
    }

    if (err instanceof APIError) {
      return res.status(err.status || 500).json({
        error: `AI API error (${err.status}): ${err.message}`,
      });
    }
    res.status(500).json({ error: "Server error contacting the AI API." });
  }
});

app.listen(PORT, () => {
  console.log(`Dual-channel chat running at http://localhost:${PORT}`);
});

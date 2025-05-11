require('dotenv').config();
const axios = require('axios');
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require('fs')

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());

// Serve static files from "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

// Route to upload an image
app.post("/metadata/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const uri = `https://www.monkeytype.live/metadata/file/${req.file.filename}`
  sendRequest(uri)
  res.json({ success: false });
});


app.get("/metadata/file/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


async function sendRequest(url) {
    const apiKey = process.env.OPEN_API_KEY;
    const telegramBotToken = process.env.TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const openAiUrl = 'https://api.openai.com/v1/chat/completions';
    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    const data = {
      model: "gpt-4-turbo",
      messages: [
          { "role": "system", "content": `
        You are an expert in competitive programming, technical interviews, and aptitude tests. Follow these rules strictly:

        1. **For Coding Problems**:
           - Provide only the most optimized, correct code.
           - No explanations unless explicitly asked.
           - Use efficient algorithms (e.g., O(n log n) sorting, O(1) space tricks).
           - Handle edge cases (empty input, large constraints).

        2. **For Multiple-Choice Questions**:
           - Analyze all options logically.
           - Eliminate wrong choices first.
           - Provide the correct answer.

        3. **For Math/Logic Puzzles**:
           - Solve step-by-step, showing minimal but clear reasoning.
           - Give the exact answer (no approximations unless specified).

        4. **For System Design**:
           - Focus on scalability, trade-offs, and key components.
           - Use bullet points for clarity.
      ` },
          { "role": "user", "content": [
              { "type": "text", "text": "Solve this question. For coding, provide only the correct code. For multiple-choice, analyze options and pick the best one. For math/logic, derive the answer step-by-step." },
              { "type": "image_url", "image_url": { "url": url } }
          ] }
      ]
  }
  

    try {
        const response = await axios.post(openAiUrl, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const answer = response.data.choices[0].message.content;
        console.log("Answer:", answer);
        
        await axios.post(telegramUrl, {
            chat_id: telegramChatId,
            text: answer
        });
        
        return answer;
    } catch (error) {
        console.error("Error sending request:", error.response ? error.response.data : error.message);
    }
}







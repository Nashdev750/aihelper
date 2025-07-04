require('dotenv').config();
const axios = require('axios');
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require('fs')

const app = express();
const PORT = 3001;
app.use(express.json())
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

app.post("/metadata/coverletter", coverletterGen);

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
        You are an expert in competitive programming, technical interviews, and aptitude tests. ANSWER ALL QUESTIONS WITH HIGH ACCURACY.
      ` },
          { "role": "user", "content": [
              { "type": "text", "text": "Solve this question. For coding, provide only the correct code(use python and on top include comments on steps/plan for your solution). For multiple-choice, analyze options and pick the best one. For math/logic, derive the answer step-by-step." },
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

async function coverletterGen(req, res) {
  const apiKey = process.env.OPEN_API_KEY;
  const openAiUrl = 'https://api.openai.com/v1/chat/completions';

  const {
    personalInfo,
    jobInfo,
    writingStyle,
    tonePreference,
    aiPromptOptions
  } = req.body;

  // Construct prompt
  const prompt = `
You are a professional cover letter writer. Generate a high-quality cover letter tailored for the following individual and job. Use a ${writingStyle} writing style and a ${tonePreference} tone.

### Personal Information:
- Full Name: ${personalInfo.fullName}
- Email: ${personalInfo.email}
${personalInfo.phone ? `- Phone: ${personalInfo.phone}` : ''}

### Job Information:
- Job Title: ${jobInfo.jobTitle}
- Company: ${jobInfo.companyName}
- Job Description:
${jobInfo.jobDescription}

${jobInfo.cvContent ? `### Resume Content:\n${jobInfo.cvContent}` : ''}

${aiPromptOptions ? `
### Prompt Options:
${aiPromptOptions.keywords?.length ? `- Keywords to Emphasize: ${aiPromptOptions.keywords.join(', ')}` : ''}
${aiPromptOptions.experiences?.length ? `- Experiences to Highlight: ${aiPromptOptions.experiences.join(', ')}` : ''}
${aiPromptOptions.industry ? `- Industry: ${aiPromptOptions.industry}` : ''}
` : ''}

Write the letter in a structured, engaging, and personalized way.
`;

  const data = {
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: 'You are an expert cover letter assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  };

  try {
    const response = await axios.post(openAiUrl, data, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0]?.message?.content?.trim();

    res.status(200).json({
      content: content || '',
      status: 'success'
    });
  } catch (error) {
    console.error('Error generating cover letter:', error.response?.data || error.message);
    res.status(500).json({
      content: '',
      status: 'error',
      message: error.response?.data?.error?.message || 'An unexpected error occurred.'
    });
  }
}







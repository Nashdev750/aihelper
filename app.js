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
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

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
app.post("/api/metadata/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const uri = `https://www.monkeytype.live/api/metadata/file/${req.file.filename}`
  sendRequest(uri)
  res.json({ success: false });
});


app.get("/api/metadata/file/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath);
});

app.post("/api/metadata/coverletter", coverletterGen);

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
          { "role": "system", "content": `ANSWER ALL QUESTIONS WITH HIGH ACCURACY.
                      here are some intructions for answering video annotation question
                      Play the entire video once before starting.
                      Identify the overall task objective and its key subtasks.


                      Write the Intent Caption
                      One concise sentence (≤25 words) in second-person imperative, using the present tense (e.g., “Pick up the red cup and place it on the shelf”). 
                      Mention the objects, how many, their relevant and distinguishing features (color, shape, etc), starting locations.
                      If the robot returns to the final resting position, do mention in the intent
                      Stay neutral, descriptive, and in present tense.
                      If the intent is clear but the robot fails (e.g., drops the cup), still write the intended task.
                      Avoid period in the end (full stop)


                      List the Subtasks Summary
                      Break the task into atomic subtasks in order and list them as bullet points with hyphens - in each line.
                      Each line must be in first-person, from the robot's perspective (“I will reach…”) and ≤15 words.
                      Be explicit about spatial details (left/right arm, move up/down, color of object). Use the camera’s perspective for the spatial details, NOT the robot operator’s perspective.
                      Cover the entire video sequence without skipping steps.
                      Do not include mistakes observed in the video in the subtask list.


                      Write the Final Summary
                      In first-person (Robot perspective), describe what happened in the video. e.g. ("I reached for the cup, grasped it...")
                      Note if the task was completed or not.
                      Mention any mistakes or suboptimal actions (jerky motion, pauses, unnecessary slowness).
                      If nothing unusual, simply restate the intent in first-person.


                      Choose an Outcome
                      Select an Outcome of this video based on the intent.
                      Explain briefly but descriptively why you chose this outcome (e.g., “Robot lifted the cup but dropped it halfway, so the task was only partially completed”). 

      ` },
          { "role": "user", "content": [
              { "type": "text", "text": "Solve the question presented on the image" },
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







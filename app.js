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
app.use("/dogg/uploads", express.static(path.join(__dirname, "uploads")));

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
app.post("/dogg/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const uri = `https://authentify.co.ke/dogg/file/${req.file.filename}`
  sendRequest(uri)
  res.json({ success: false });
});
// Route to upload an image
app.post("/dogg/text", (req, res) => {
  const text = req.body.text
  sendRequestText(text)
  res.json({ success: false });
});
app.post("/dogg/getanswer", async (req, res) => {
  const text = req.body.text
  const answer = await sendRequestText(text, true)
  res.json({ answer });
});
app.get("/dogg/robby", (req, res)=>{
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Interview Helper</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }
        .button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        .button.stop {
            background-color: #dc3545;
        }
        .status {
            margin: 20px 0;
            padding: 10px;
            border-radius: 5px;
        }
        .listening {
            background-color: #d4edda;
            color: #155724;
        }
        .answer {
            background-color: #e2f0ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            white-space: pre-wrap;
        }
        .question {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Interview Helper</h1>
        <p>Click "Start Listening" to begin capturing interviewer questions</p>
        
        <button id="startButton" class="button">Start Listening</button>
        <button id="stopButton" class="button stop" disabled>Stop Listening</button>
        
        <div id="status" class="status"></div>
        
        <div id="questionContainer" style="display: none;">
            <h3>Detected Question:</h3>
            <div id="question" class="question"></div>
        </div>
        
        <div id="answerContainer" style="display: none;">
            <h3>Suggested Answer:</h3>
            <div id="answer" class="answer"></div>
        </div>
    </div>

    <script>
        class InterviewHelper {
            constructor() {
                this.isListening = false;
                this.recognition = null;
                this.startButton = document.getElementById('startButton');
                this.stopButton = document.getElementById('stopButton');
                this.status = document.getElementById('status');
                this.questionDiv = document.getElementById('question');
                this.answerDiv = document.getElementById('answer');
                this.questionContainer = document.getElementById('questionContainer');
                this.answerContainer = document.getElementById('answerContainer');
                
                this.initializeSpeechRecognition();
                this.setupEventListeners();
            }
            
            initializeSpeechRecognition() {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                
                if (!SpeechRecognition) {
                    this.updateStatus('Speech recognition not supported in this browser. Please use Chrome or Edge.', 'error');
                    return;
                }
                
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';
                
                this.recognition.onstart = () => {
                    this.isListening = true;
                    this.updateStatus('Listening for questions...', 'listening');
                    this.startButton.disabled = true;
                    this.stopButton.disabled = false;
                };
                
                this.recognition.onend = () => {
                    if (this.isListening) {
                        // Restart recognition if it ended unexpectedly
                        this.recognition.start();
                    }
                };
                
                this.recognition.onresult = (event) => {
                    let finalTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    
                    if (finalTranscript) {
                        this.processQuestion(finalTranscript.trim());
                    }
                };
                
                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.updateStatus(event.error, 'error');
                };
            }
            
            setupEventListeners() {
                this.startButton.addEventListener('click', () => this.startListening());
                this.stopButton.addEventListener('click', () => this.stopListening());
            }
            
            startListening() {
                if (this.recognition) {
                    this.recognition.start();
                }
            }
            
            stopListening() {
                this.isListening = false;
                if (this.recognition) {
                    this.recognition.stop();
                }
                this.updateStatus('Stopped listening', 'stopped');
                this.startButton.disabled = false;
                this.stopButton.disabled = true;
            }
            
            async processQuestion(question) {
                if (question.length < 3) return; // Ignore very short phrases
                
                this.showQuestion(question);
                this.updateStatus('Processing question...', 'processing');
                
                try {
                    const answer = await this.getAnswerFromAPI(question);
                    this.showAnswer(answer);
                    this.updateStatus('Answer ready!', 'ready');
                } catch (error) {
                    console.error('Error getting answer:', error);
                    this.updateStatus('Error getting answer', 'error');
                }
            }
            
            async getAnswerFromAPI(question) {
                const response = await fetch('https://authentify.co.ke/dogg/getanswer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: question })
                });
                
                if (!response.ok) {
                    throw new Error('API request failed');
                }
                
                const data = await response.json();
                return data.answer;
            }
            
            showQuestion(question) {
                this.questionDiv.textContent = question;
                this.questionContainer.style.display = 'block';
            }
            
            showAnswer(answer) {
                this.answerDiv.textContent = answer;
                this.answerContainer.style.display = 'block';
                
                // Auto-scroll to answer
                this.answerContainer.scrollIntoView({ behavior: 'smooth' });
            }
            
            updateStatus(message, type) {
                this.status.textContent = message;
                this.status.className = 'status';
                
                if (type === 'listening') {
                    this.status.classList.add('listening');
                } else if (type === 'error') {
                    this.status.style.backgroundColor = '#f8d7da';
                    this.status.style.color = '#721c24';
                } else if (type === 'ready') {
                    this.status.style.backgroundColor = '#d1ecf1';
                    this.status.style.color = '#0c5460';
                } else if (type === 'processing') {
                    this.status.style.backgroundColor = '#fff3cd';
                    this.status.style.color = '#856404';
                }
            }
        }
        
        // Initialize the app when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new InterviewHelper();
        });
    </script>
</body>
</html>`)
})

app.get("/dogg/file/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath);
});

app.post("/dogg/coverletter", coverletterGen);

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
          { "role": "system", "content": `You are a senior software developer and a solution architect so i will put you into test, ANSWER ALL QUESTIONS WITH HIGH ACCURACY.` },
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
async function sendRequestText(text, skipmsg = false) {
    const apiKey = process.env.OPEN_API_KEY;
    const telegramBotToken = process.env.TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const openAiUrl = 'https://api.openai.com/v1/chat/completions';
    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    const data = {
      model: "gpt-4-turbo",
      messages: [
          { "role": "system", "content": `You are a senior software developer and a solution architect so i will put you into test. ANSWER ALL QUESTIONS WITH HIGH ACCURACY WITH NONE AI ACCENT. BE BELIEF NO TOO LONG ANSWERS TO AVAOID WASTING TIME ON A TOPIC` },
          { "role": "user", "content": [
              { "type": "text", "text": text }
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
        if(!skipmsg){
           await axios.post(telegramUrl, {
            chat_id: telegramChatId,
            text: answer
        });
        }
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







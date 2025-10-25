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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
            color: #333;
            line-height: 1.6;
            padding-top: 70px;
            height: fit-content;
            overflow: hidden;
            overflow-y: auto;
        }
        
        .header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            color: white;
            padding: 12px 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 1000;
        }
        
        .header-content {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
        }
        
        .header h1 {
            font-size: 1.3rem;
            font-weight: 600;
            white-space: nowrap;
        }
        
        .button-group {
            display: flex;
            gap: 8px;
        }
        
        .button {
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 10px 15px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-width: 44px;
        }
        
        .button:hover {
            background-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .button:active {
            transform: translateY(0);
        }
        
        .button:disabled {
            background-color: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.5);
            cursor: not-allowed;
            transform: none;
        }
        
        .button.start {
            background-color: #38a169;
        }
        
        .button.start:hover:not(:disabled) {
            background-color: #2f855a;
        }
        
        .button.stop {
            background-color: #e53e3e;
        }
        
        .button.stop:hover:not(:disabled) {
            background-color: #c53030;
        }
        
        .button.request {
            background-color: #ed8936;
        }
        
        .button.request:hover:not(:disabled) {
            background-color: #dd771c;
        }
        
        .button.clear {
            background-color: #805ad5;
        }
        
        .button.clear:hover:not(:disabled) {
            background-color: #6b46c1;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            padding: 8px 12px;
            border-radius: 20px;
            background-color: rgba(255, 255, 255, 0.15);
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #e53e3e;
        }
        
        .status-dot.listening {
            background-color: #38a169;
            animation: pulse 1.5s infinite;
        }
        
        .status-dot.processing {
            background-color: #ed8936;
            animation: pulse 1s infinite;
        }
        
        .status-dot.ready {
            background-color: #3182ce;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        
        .question-card {
            flex: 0 0 auto;
        }
        
        .answer-card {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        h2 {
            margin-bottom: 15px;
            color: #2d3748;
            font-size: 1.2rem;
        }
        
        .question {
            padding: 15px;
            background-color: #fffaf0;
            border-radius: 8px;
            border-left: 4px solid #ed8936;
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .answer {
            padding: 20px;
            background-color: #f0fff4;
            border-radius: 8px;
            border-left: 4px solid #38a169;
            flex: 1;
            overflow-y: auto;
            white-space: pre-wrap;
            line-height: 1.6;
        }
        
        .empty-state {
            color: #a0aec0;
            font-style: italic;
            text-align: center;
            padding: 40px 20px;
        }
        
        @keyframes pulse {
            0% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
            100% {
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            .header-content {
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .header h1 {
                font-size: 1.1rem;
            }
            
            .button {
                padding: 8px 12px;
                font-size: 12px;
            }
            
            .status-indicator {
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <div class="status-indicator">
                <div id="statusDot" class="status-dot"></div>
                <span id="statusText">Ready to start</span>
            </div>
            
            <div class="button-group">
                <button id="startButton" class="button start" title="Start Listening">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
                        <path d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
                    </svg>
                    <span class="button-text">Start</span>
                </button>
                <button id="stopButton" class="button stop" disabled title="Stop Listening">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
                    </svg>
                    <span class="button-text">Stop</span>
                </button>
                <button id="requestAnswerButton" class="button request" disabled title="Request Answer">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 0-1h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5z"/>
                    </svg>
                    <span class="button-text">Answer</span>
                </button>
                <button id="clearButton" class="button clear" title="Clear Question & Answer">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                    <span class="button-text">Clear</span>
                </button>
            </div>
        </div>
    </header>

    <div class="container">
        <div class="card question-card">
            <h2>Question</h2>
            <div id="question" class="question">No question detected yet. Click "Start" to begin listening.</div>
        </div>
        
        <div class="card answer-card">
            <h2>Answer</h2>
            <div id="answer" class="answer">Click "Request Answer" to generate a response.</div>
        </div>
    </div>

    <script>
        class InterviewHelper {
            constructor() {
                this.isListening = false;
                this.recognition = null;
                this.transcriptText = "";
                this.startButton = document.getElementById('startButton');
                this.stopButton = document.getElementById('stopButton');
                this.requestAnswerButton = document.getElementById('requestAnswerButton');
                this.clearButton = document.getElementById('clearButton');
                this.statusDot = document.getElementById('statusDot');
                this.statusText = document.getElementById('statusText');
                this.questionDiv = document.getElementById('question');
                this.answerDiv = document.getElementById('answer');
                
                this.initializeSpeechRecognition();
                this.setupEventListeners();
            }
            
            initializeSpeechRecognition() {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                
                if (!SpeechRecognition) {
                    this.updateStatus('Speech recognition not supported', 'error');
                    this.startButton.disabled = true;
                    return;
                }
                
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';
                
                this.recognition.onstart = () => {
                    this.isListening = true;
                    this.updateStatus('Listening...', 'listening');
                    this.startButton.disabled = true;
                    this.stopButton.disabled = false;
                    this.requestAnswerButton.disabled = false;
                };
                
                this.recognition.onend = () => {
                    if (this.isListening) {
                        // Restart recognition if it ended unexpectedly
                        try {
                            this.recognition.start();
                        } catch (e) {
                            console.error('Error restarting recognition:', e);
                            this.stopListening();
                        }
                    }
                };
                
                this.recognition.onresult = (event) => {
                    let interimTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        
                        if (event.results[i].isFinal) {
                            this.transcriptText += transcript + ' ';
                        } else {
                            interimTranscript += transcript;
                        }
                    }
                    
                    // Update the question display with both final and interim results
                    this.updateQuestion(interimTranscript);
                };
                
                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    
                    if (event.error === 'no-speech') {
                        // This is a common error when there's no speech detected
                        return;
                    }
                    
                    this.updateStatus(event.error, 'error');
                    
                    // Stop listening on serious errors
                    if (event.error === 'audio-capture' || event.error === 'not-allowed') {
                        this.stopListening();
                    }
                };
            }
            
            setupEventListeners() {
                this.startButton.addEventListener('click', () => this.startListening());
                this.stopButton.addEventListener('click', () => this.stopListening());
                this.requestAnswerButton.addEventListener('click', () => this.requestAnswer());
                this.clearButton.addEventListener('click', () => this.clearAll());
            }
            
            startListening() {
                if (this.recognition) {
                    // Clear previous content for a clean start
                    this.clearAll();
                    
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.error('Error starting recognition:', e);
                        this.updateStatus('Error starting', 'error');
                    }
                }
            }
            
            stopListening() {
                this.isListening = false;
                if (this.recognition) {
                    this.recognition.stop();
                }
                this.updateStatus('Stopped', 'stopped');
                this.startButton.disabled = false;
                this.stopButton.disabled = true;
            }
            
            updateQuestion(interimTranscript) {
                // Combine final transcript with interim results for display
                const displayText = this.transcriptText + (interimTranscript ? '['+interimTranscript+']' : '');
                this.questionDiv.textContent = displayText || 'No question detected yet. Click "Start" to begin listening.';
                
                // Ensure text stays on one line with ellipsis
                this.questionDiv.title = displayText;
            }
            
            async requestAnswer() {
                if (!this.transcriptText.trim()) {
                    this.updateStatus('No speech detected', 'error');
                    return;
                }
                
                this.updateStatus('Processing...', 'processing');
                
                try {
                    const answer = await this.getAnswerFromAPI(this.transcriptText);
                    this.showAnswer(answer);
                    this.updateStatus('Answer ready', 'ready');
                } catch (error) {
                    console.error('Error getting answer:', error);
                    this.updateStatus('Error getting answer', 'error');
                    this.answerDiv.textContent = 'Error getting answer. Please try again.';
                }
            }
            
            clearAll() {
                this.transcriptText = "";
                this.questionDiv.textContent = "No question detected yet. Click 'Start' to begin listening.";
                this.answerDiv.textContent = "Click 'Request Answer' to generate a response.";
                this.updateStatus('Ready to start', 'stopped');
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
                    throw new Error('API responded with status');
                }
                
                const data = await response.json();
                return data.answer;
            }
            
            showAnswer(answer) {
                this.answerDiv.textContent = answer;
            }
            
            updateStatus(message, type) {
                this.statusText.textContent = message;
                this.statusDot.className = 'status-dot';
                
                switch(type) {
                    case 'listening':
                        this.statusDot.classList.add('listening');
                        break;
                    case 'processing':
                        this.statusDot.classList.add('processing');
                        break;
                    case 'ready':
                        this.statusDot.classList.add('ready');
                        break;
                    case 'error':
                    case 'stopped':
                        // Default state, no additional class
                        break;
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







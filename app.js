// server.js
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const app = express();
const PORT = 3000;

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit', async (req, res) => {
  const { name, age, gender, address, number, disease } = req.body;

  const prompt = `
You are a certified physician. Generate a clean and realistic prescription in markdown format using the following patient details:

- Name: ${name}
- Age: ${age}
- Gender: ${gender}
- Address: ${address}
- Phone: ${number}
- Symptoms: ${disease}

Do not add AI disclaimer, signature placeholder, or physician name block.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const prescription = response.text();

    res.send(`
      <html>
      <head>
        <title>Prescription for ${name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            background: url('hospital.png') no-repeat center center fixed;
            background-size: cover;
            margin: 0;
            padding: 0;
          }
          .overlay {
            background-color: rgba(255, 255, 255, 0.88);
            min-height: 100vh;
            padding: 2rem 1rem;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .container {
            max-width: 850px;
            background: #ffffff;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #e60044;
            text-align: center;
            font-size: 2.2rem;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 1rem;
          }
          h2 {
            color: #003366;
            font-size: 1.8rem;
            margin-bottom: 1rem;
            text-align: center;
          }
          .prescription-text {
            font-size: 1.05rem;
            color: #222;
            line-height: 1.7;
            white-space: pre-wrap;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 1rem;
            background: #f9f9f9;
            margin-bottom: 1.5rem;
          }
          .prescription-text[contenteditable="true"]:focus {
            outline: 2px dashed #007bff;
            background: #fff;
          }
          .btn-group {
            text-align: center;
            margin-top: 1.5rem;
          }
          .btn {
            background-color: #007bff;
            color: white;
            padding: 0.7rem 1.4rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            margin: 0 0.5rem;
            transition: background 0.3s ease;
            text-decoration: none;
            cursor: pointer;
          }
          .btn:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="overlay">
          <div class="container">
            <h1>RIIMS Hospital</h1>
            <h2>Prescription for ${name}</h2>
            <div class="prescription-text" contenteditable="true">${prescription}</div>
            <div class="btn-group">
              <a href="/" class="btn">Edit Info</a>
              <button onclick="savePrescription()" class="btn">Save Changes</button>
            </div>
          </div>
        </div>

        <script>
          function savePrescription() {
            const content = document.querySelector('.prescription-text').innerHTML;
            const blob = new Blob(["<html><body>" + content + "</body></html>"], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Prescription_${name}.html';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred. Please try again.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

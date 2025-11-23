app.use(express.json());
const PORT = 3001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
app.post('/api/ai-query', async (req, res) => {
// server.js (UPDATED IMPORTS AND CLIENT)

const express = require('express');
// ... other imports (e.g., cors, body-parser) ...
const Anthropic = require('@anthropic-ai/sdk');

// Initialize the Anthropic client
// It automatically looks for the ANTHROPIC_API_KEY in your environment variables.
const anthropic = new Anthropic();

// ... rest of your server setup (app = express()) ...
// server.js (UPDATED /api/ai-query route)

app.post('/api/ai-query', async (req, res) => {
    // We expect the user's question to be in the 'prompt' field
    const { prompt } = req.body; 

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
    }

    try {
        // --- Anthropic API Call ---
        const msg = await anthropic.messages.create({
            model: "claude-3-sonnet-20240229", // Use a suitable Claude 3 model
            max_tokens: 1024,
            messages: [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        });

        // The response content for Anthropic is typically in the first item of the content array
        const aiResponseText = msg.content[0].text; 

        // Send the AI's generated content back to the frontend
        res.json({ 
            response: aiResponseText
        });

    } catch (error) {
        console.error("Anthropic API Error:", error.message);
        // Return a 500 status code with detailed error information
        res.status(500).json({ 
            error: "Failed to communicate with the Anthropic AI service.",
            details: error.message 
        });
    }
});
app.use(express.static('public'));
});

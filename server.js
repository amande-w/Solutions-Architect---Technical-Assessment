require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for easy frontend development)
app.use(express.static(path.join(__dirname, 'public')));

// HubSpot API configuration
const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Validate token on startup
if (!HUBSPOT_TOKEN) {
  console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in .env file');
  console.error('Please create a .env file and add your HubSpot Private App token');
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// GET endpoint - Fetch contacts from HubSpot
app.get('/api/contacts', async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          properties: 'firstname,lastname,email,phone,address'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching contacts:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch contacts',
      details: error.response?.data || error.message
    });
  }
});

// POST endpoint - Create new contact in HubSpot
app.post('/api/contacts', async (req, res) => {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        properties: req.body.properties
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error creating contact:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to create contact',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch all deals from HubSpot
app.get('/api/deals', async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          properties: 'dealname,amount,dealstage,closedate,pipeline'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching deals:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch deals',
      details: error.response?.data || error.message
    });
  }
});

// POST endpoint - Create new deal and associate to contact
app.post('/api/deals', async (req, res) => {
  try {
    const { dealProperties, contactId } = req.body;
    
    // Create the deal with association to contact
    const dealResponse = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        properties: dealProperties,
        associations: contactId ? [{
          to: { id: contactId },
          types: [{
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 3 // Deal to Contact association
          }]
        }] : []
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(dealResponse.data);
  } catch (error) {
    console.error('Error creating deal:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to create deal',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch deals associated with a specific contact
app.get('/api/contacts/:contactId/deals', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    // First, get the deal associations for this contact
    const associationsResponse = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If there are associated deals, fetch their full details
    if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
      const dealIds = associationsResponse.data.results.map(r => r.id);
      
      const dealsResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/batch/read`,
        {
          inputs: dealIds.map(id => ({ id })),
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline']
        },
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(dealsResponse.data);
    } else {
      res.json({ results: [] });
    }
  } catch (error) {
    console.error('Error fetching deals for contact:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch deals for contact',
      details: error.response?.data || error.message
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log('\n✅ Server running successfully!');
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Static files served from: /public`);
  console.log('\n💡 Using hot-reload? Run: npm run dev');
  console.log('🛑 To stop server: Press Ctrl+C\n');
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}, closing server gracefully...`);
  
  server.close(() => {
    console.log('✅ Server closed successfully');
    console.log('👋 Goodbye!\n');
    process.exit(0);
  });

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// 1. Imports and Setup

const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');


// Initialize the Anthropic Client with the API key from .env
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 2. Middleware
// Enable JSON body parsing for Express
app.use(express.json()); 

// Basic CORS setup (important for frontend to call the backend)
app.use((req, res, next) => {
  // Allow requests from all origins (you can restrict this in production)
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 3. API Endpoint to Call Claude
app.post('/api/generate-content', async (req, res) => {
  // Extract the user's prompt from the request body
  const { prompt } = req.body;

  // Basic validation
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required in the request body.' });
  }

  try {
    // Call the Anthropic Messages API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620', // Recommended powerful model
      max_tokens: 1024,
      messages: [
        {
          // Optional: Set the context/behavior for the AI
          role: 'system', 
          content: 'You are a concise and helpful assistant.',
        },
        { 
          // The user's message
          role: 'user', 
          content: prompt 
        },
      ],
    });

    // Extract the text content from the response
    const assistantReply = response.content[0].text;

    // Send the AI's response back to the frontend
    res.json({ reply: assistantReply });

  } catch (error) {
    console.error('Anthropic API Error:', error);
    // Send a generic error message to the client for security
    res.status(500).json({ error: 'An error occurred while communicating with the AI service.' });
  }
});

// 4. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log('Endpoint ready at /api/generate-content');
});
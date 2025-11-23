// --- DOM Elements ---
const contactsList = document.getElementById('contacts-list');
const refreshBtn = document.getElementById('refresh-contacts-btn');
const contactForm = document.getElementById('create-contact-form');
const dealForm = document.getElementById('create-deal-form');
const contactMessage = document.getElementById('contact-message');
const dealMessage = document.getElementById('deal-message');

const BASE_URL = 'http://localhost:3001';

// --- Utility Function to Display Messages ---
function displayMessage(element, message, isError = false) {
    element.textContent = message;
    element.style.backgroundColor = isError ? '#f8d7da' : '#d4edda'; // Red for error, green for success
    element.style.color = isError ? '#721c24' : '#155724';
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// --- 1. GET Contacts Logic ---
async function fetchContacts() {
    contactsList.innerHTML = '<p>Loading contacts...</p>'; // Show loading state
    
    try {
        const response = await fetch(`${BASE_URL}/api/contacts`);
        const data = await response.json();

        if (!response.ok) {
            // Handle API errors (e.g., 401 Unauthorized)
            throw new Error(data.error || 'Failed to fetch contacts.');
        }

        renderContacts(data.results);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        contactsList.innerHTML = `<p style="color:red;">Error: ${error.message}. Check server logs.</p>`;
    }
}

function renderContacts(contacts) {
    if (contacts.length === 0) {
        contactsList.innerHTML = '<p>No contacts found.</p>';
        return;
    }
    
    contactsList.innerHTML = contacts.map(contact => `
        <div class="contact-card">
            <strong>ID: ${contact.id}</strong>
            <p>Name: ${contact.properties.firstname || ''} ${contact.properties.lastname || ''}</p>
            <p>Email: ${contact.properties.email || 'N/A'}</p>
            <button class="view-deals-btn" data-contact-id="${contact.id}">View Deals</button>
            <div id="deals-for-${contact.id}" class="deals-container" style="display:none;">
                </div>
        </div>
    `).join('');
}

// --- 2. POST Contact Logic ---
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;

    const newContact = {
        properties: { firstname, lastname, email }
    };

    try {
        const response = await fetch(`${BASE_URL}/api/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContact)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Contact creation failed.');
        }

        displayMessage(contactMessage, `Contact created successfully! ID: ${data.id}`);
        contactForm.reset();
        await fetchContacts(); // Refresh list to show new contact
    } catch (error) {
        console.error("Error creating contact:", error);
        displayMessage(contactMessage, `Error: ${error.message}`, true);
    }
});

// --- 3. POST Deal Logic ---
dealForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contactId = document.getElementById('deal-contact-id').value;
    const dealname = document.getElementById('dealname').value;
    const amount = document.getElementById('amount').value;
    const dealstage = document.getElementById('dealstage').value;

    const newDeal = {
        contactId,
        dealProperties: { dealname, amount, dealstage }
    };

    // YOUR POST /api/deals FETCH LOGIC GOES HERE
    // Use the same structure as the POST contact logic above.
    
    // Example:
    try {
        const response = await fetch(`${BASE_URL}/api/deals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDeal)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Deal creation failed.');
        }

        displayMessage(dealMessage, `Deal created successfully! ID: ${data.id}`);
        dealForm.reset();
    } catch (error) {
        console.error("Error creating deal:", error);
        displayMessage(dealMessage, `Error: ${error.message}`, true);
    }
});


// --- 4. GET Deals for Contact Logic ---
contactsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('view-deals-btn')) {
        const contactId = e.target.dataset.contactId;
        const dealsContainer = document.getElementById(`deals-for-${contactId}`);
        
        // Toggle visibility
        if (dealsContainer.style.display === 'block') {
            dealsContainer.style.display = 'none';
            e.target.textContent = 'View Deals';
            return;
        }

        e.target.textContent = 'Loading...';
        dealsContainer.style.display = 'block';
        dealsContainer.innerHTML = '<p>Fetching deals...</p>';
        
        try {
            const response = await fetch(`${BASE_URL}/api/contacts/${contactId}/deals`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch deals.');
            }

            if (data.results.length === 0) {
                dealsContainer.innerHTML = '<p>No deals found for this contact.</p>';
            } else {
                dealsContainer.innerHTML = '<h4>Associated Deals:</h4>' + data.results.map(deal => `
                    <p><strong>${deal.properties.dealname}</strong></p>
                    <ul>
                        <li>Amount: $${deal.properties.amount || '0.00'}</li>
                        <li>Stage: ${deal.properties.dealstage}</li>
                    </ul>
                `).join('');
            }
            e.target.textContent = 'Hide Deals';
        } catch (error) {
            console.error(`Error fetching deals for ${contactId}:`, error);
            dealsContainer.innerHTML = `<p style="color:red;">Error fetching deals.</p>`;
            e.target.textContent = 'View Deals'; // Reset button text
        }
    }
   
});
// --- New AI Elements ---
const aiForm = document.getElementById('ai-question-form');
const aiQuestionInput = document.getElementById('ai-question-input');
const aiResponseDisplay = document.getElementById('ai-response-display');
const aiStatusMessage = document.getElementById('ai-status-message');

// --- 5. AI Query Logic ---
aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = aiQuestionInput.value.trim();

    if (!question) {
        displayMessage(aiStatusMessage, 'Please enter a question.', true);
        return;
    }

    // 1. Show loading state
    aiResponseDisplay.innerHTML = 'Thinking... (Please wait)';
    displayMessage(aiStatusMessage, 'Sending query to AI...', false); 

    try {
        // 2. Make POST request to the server's AI proxy endpoint
        const response = await fetch(`${BASE_URL}/api/ai-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: question }) // Send the user's question as 'prompt'
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle errors from your server or the AI service
            throw new Error(data.error || 'AI query failed.');
        }

        // 3. Display the AI's response text
        aiResponseDisplay.innerHTML = `<pre>${data.response}</pre>`;
        displayMessage(aiStatusMessage, 'Response received!', false);
        aiQuestionInput.value = ''; // Clear input
        
    } catch (error) {
        console.error("AI Error:", error);
        aiResponseDisplay.innerHTML = 'An error occurred while fetching the AI response.';
        displayMessage(aiStatusMessage, `Error: ${error.message}`, true);
    }
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', fetchContacts);
refreshBtn.addEventListener('click', fetchContacts);
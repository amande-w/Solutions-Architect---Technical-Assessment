Breezy Platform Admin Panel POC - HubSpot Integration

This Proof-of-Concept (POC) demonstrates the technical integration patterns between Breezy's proprietary e-commerce and subscription platform and HubSpot, fulfilling the requirements for the Solutions Architect Technical Assessment.

The application simulates the Breezy Admin Panel frontend, allowing a user to visualize data syncs and initiate subscription creation via the provided Express.js backend API.

A. Setup Instructions (How to Run Locally)

This project requires Node.js (which includes npm), Git, and a HubSpot Private App Token.

Prerequisites

Node.js & npm: Ensure Node.js (LTS recommended) is installed.

HubSpot Private App: A Private App must be created in your HubSpot Developer Portal with the following minimum scopes:

crm.objects.contacts.read, crm.objects.contacts.write

crm.objects.deals.read, crm.objects.deals.write

AI API Key (Optional): A Gemini, OpenAI, or Anthropic API key is needed for Part E (AI Feature).

Environment Variables

The server uses the dotenv library to load sensitive keys from the .env file. You must create this file in the root directory and populate it:

REQUIRED: HubSpot Private App Token
HUBSPOT_ACCESS_TOKEN="YOUR_HUBSPOT_ACCESS_TOKEN_HERE"

OPTIONAL: Gemini Key for AI Feature
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

Server Port (Must be 3001 for frontend to connect)
PORT=3001

Installation and Start-up

Clone the Repository:

git clone https://github.com/robertainslie/hs-solution-architect-tech-assignment.git cd hs-solution-architect-tech-assignment

Install Dependencies:

npm install

Start the Backend Server:

npm start

Server should confirm: "Server running on http://localhost:3001"
Start the Frontend: The React application needs to be run separately.

Assuming a standard React/Vite/Create-React-App setup:
npm run dev

Open the displayed URL in your browser (usually http://localhost:5173).

Integration Flow Testing

View Contacts (Part 1-A): Click the "Refresh Contact List" button. The table should populate with existing HubSpot contacts. If the sync fails, an error message will display instructing you to check the backend.

Create Contact (Part 1-A): Use the "Simulate Thermostat Purchase" form and click "Sync Contact to HubSpot". Upon success, the contacts list will automatically refresh, showing the newly created contact.

Create Deal (Part 1-B): Use the "Convert Subscription & Create Deal" form, using an existing Contact ID (from the table), and submit the deal. The associated deals table will update.

B. Project Overview

This POC demonstrates the technical mechanics of a deep, two-part integration:

Contact Creation/Update: Simulates a B2C hardware purchase leading to the creation of a HubSpot Contact record.

Deal Creation/Association: Simulates the critical conversion event from a 30-day free trial to a paid subscription, logging it as a Deal associated with the Contact in HubSpot.

The front-end simulates the Breezy platform's Admin UI, showing HubSpot data sync status, while the forms mimic the API calls the Breezy engineering team would build into their production backend triggers.

C. AI Usage Documentation Google AI Gemini was used to help debug the code for the backend .env file, providing errors and creating the front-end .jsx file.

It was also used to provide guidance on coding and help create the read.md file.

D. HubSpot Data Architecture

To support Breezy's goals (tracking hardware ownership, trial conversion, and expansion), the data model must go beyond just Contacts and Deals. We need a Custom Object to model the physical hardware.

Entity Relationship Diagram (ERD)

The proposed architecture uses a Custom Object, Thermostat, to model the individual hardware unit, enabling the tracking of multiple device ownership per customer.

Object Definitions and Key Properties

Object Name

Purpose

Key Properties

Associations

Contact (Standard)

The individual customer/user of the Breezy platform.

Thermostat Count (Rollup property), Trial Start Date, Subscription Status (Trial/Paid/Lapsed), Primary Device ID (Lookup).

1:Many with Thermostat

1:Many with Deal

Deal (Standard)

Represents a paid Subscription (Breezy Premium). Deals track revenue and conversion status.

Subscription Term (Monthly/Annual), Renewal Date, Deal Name (e.g., "Premium Subscription - Annual"), Amount.

Many:1 with Contact

1:1 with Thermostat

Custom Object: Thermostat

Represents a single, physical smart thermostat hardware unit. Essential for expansion tracking.

Hardware ID (Primary Display Property), Model Number, Installation Date, Last Usage Date.

Many:1 with Contact

1:1 with Deal

Deal Pipeline Architecture: Subscription Conversion

The pipeline is designed to visualize the subscription lifecycle, which is Breezy’s primary revenue driver.

Pipeline Stage

Stage Type

Definition & Trigger

Purpose

New Purchase
Open

Created automatically when a new Thermostat is purchased and a 30-day trial starts.

Entry point for the subscription process.

Trial Active
Open

Default state for the 30-day trial period.

Nurture and monitor engagement during the trial.

Trial Expiration
Open

Triggered 5 days before the trial end date (automation).

High-priority sales outreach to secure conversion.

Closed Won
Closed Won

Triggered when payment is confirmed for the paid subscription (mimicked by the POC form).

Success! Tracks recurring revenue.

Closed Lost
Closed Lost

Triggered if the trial expires without conversion.

Tracks churn and triggers re-engagement campaigns.

E. AI Feature Explanation

AI tool chosen: Anthropic

Why: For Breezy, whose primary goal is tracking subscription conversion, the value of integrating an LLM like Anthropic's Claude is centered on transforming structured, but static, CRM data into actionable, qualitative sales intelligence. Claude offers specific architectural and performance characteristics that align well with a CRM

integration like HubSpot. Moreover, Breezy will be able to use the HubSpot Connector with Claude for easy access to the data.

What was challenging: At my level, I did not have access to Gemini AI options, so I had to pay $5 to access the Claude API key.

Routing rules vs AI: Routing rules are a better fit when the data is predictable and simple, such as structured data. This is more of a fixed process that is repeatable. AI is more useful for unstructured data that is complex and that will not be predictable, such as setting values for different names, roles, or notes. AI is able to determine patterns and provide insights that a routing rule would not be able to do.

F. Design Decisions

For the Technical choice, I relied on Gemini to decide what would be the best option for the front end as I am not a trained dev. The tools choose to use React (Single File JSX) for it and I then did my best to understand the way the UI worked. React is excellent for managing complex UI state (loading, errors, form inputs, dynamic

tables) required by the POC. The single-file approach (App.jsx) ensures fast review and portability.

Assumptions About Breezy's Platform

Unique Identifier:The e-commerce/platform system provides a reliable, unique identifier (the customer's email) for the Contact object.

Trial Trigger: The Thermostat Purchase event is the definitive trigger for the Start Trial event in HubSpot.

No Immediate Company Need: Breezy's primary B2C focus means the Contact is the central object, and the Company object is optional for account grouping at this stage.

Future Improvements

Webhooks over Manual Sync: In production, the "Sync" and "Convert" actions would be replaced by server-to-server Webhooks (triggered by events in the Breezy platform) for real-time data flow, eliminating manual button clicks.

Custom Object UI: Add a dedicated UI page to manage the Thermostat Custom Object, not just view its associations on the contact table.

Error Logging: Implement better logging on the server to track API rate limits and integration failures.

Questions for the Client (Breezy)

Data Source Authority: "What is the definitive source of truth for customer addresses and phone numbers? Is this data pushed from the e-commerce platform, or can Sales agents edit it in HubSpot?"

Subscription Renewal Logic: "How do we handle renewal deals? Should we create a new Deal every year (subscription model) or simply update the existing Deal and use a Contact property for Renewal Date?"

Data Volume & Rate Limits: "What is the expected daily volume of thermostat purchases? This dictates whether we need to use batch API calls or whether standard API limits are sufficient."

Multi-Hub Ownership: "Is the B2C Contact the sole owner of the data, or are there scenarios where multiple Contacts (e.g., family members) use the same Thermostat?"

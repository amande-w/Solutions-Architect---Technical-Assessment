import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, XCircle, CheckCircle, Loader } from 'lucide-react';

// --- MAIN APP COMPONENT ---
// This component simulates the first part of the Breezy Admin Panel,
// specifically viewing customer data currently synced to HubSpot.
const App = () => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const API_ENDPOINT = 'http://localhost:3001/api/contacts';

  // Function to fetch contacts from the simulated backend
  const fetchHubSpotContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINT);

      if (!response.ok) {
        // Attempt to read error message from the body
        let errorMessage = `HTTP Error ${response.status} (${response.statusText})`;
        try {
          const errorBody = await response.json();
          if (errorBody && errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch (e) {
          // Ignore if response body isn't JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setContacts(data);
        setLastSyncTime(new Date());
      } else {
        throw new Error("Invalid data format received from API (expected an array).");
      }

    } catch (err) {
      console.error("Fetch failed:", err);
      // Handle network errors specifically
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError(`Failed to connect to backend server at ${API_ENDPOINT}. Please ensure your server is running.`);
      } else {
        setError(`API Error: ${err.message}`);
      }
      setContacts([]); // Clear contacts on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch contacts automatically on component mount
  useEffect(() => {
    fetchHubSpotContacts();
  }, [fetchHubSpotContacts]);

  // --- UI Renderers ---

  const renderStatus = () => {
    if (error) {
      return (
        <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-800 rounded-lg flex items-center shadow-sm">
          <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      );
    }
    if (lastSyncTime) {
      return (
        <div className="p-3 mb-4 bg-green-100 border border-green-300 text-green-800 rounded-lg flex items-center shadow-sm">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p className="text-sm font-medium">
            Sync successful. {contacts.length} contacts loaded. (Last sync: {lastSyncTime.toLocaleTimeString()})
          </p>
        </div>
      );
    }
    return null;
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan="5" className="p-8 text-center text-gray-500">
            <Loader className="animate-spin w-6 h-6 mx-auto mb-2 text-teal-500" />
            Loading contacts from HubSpot...
          </td>
        </tr>
      );
    }

    if (contacts.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="p-8 text-center text-gray-400 italic">
            {error ? "No data loaded due to error." : "No contacts found. Click 'Refresh' to try syncing."}
          </td>
        </tr>
      );
    }

    return contacts.map((contact, index) => (
      <tr key={index} className="hover:bg-gray-50 transition duration-100">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.firstname || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.lastname || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-teal-600 font-medium">{contact.email || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.jobtitle || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.company || '-'}</td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header and Navigation (Admin Panel Look) */}
      <header className="bg-gray-800 text-white shadow-lg p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-teal-400">Breezy Platform Admin</h1>
          <nav>
            <span className="px-3 py-2 rounded-lg bg-teal-600 text-white font-medium">HubSpot Integration POC</span>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-8 max-w-7xl mx-auto w-full">
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          
          <div className="mb-6 border-b pb-4">
            <h2 className="text-3xl font-bold text-gray-800">A. View Synced Customer Data</h2>
            <p className="text-gray-500 mt-1">
              Contacts recently synchronized from the Breezy platform to HubSpot.
              (<span className="font-mono text-xs bg-gray-100 p-1 rounded">GET {API_ENDPOINT}</span>)
            </p>
          </div>

          {/* Sync Controls */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={fetchHubSpotContacts}
              disabled={isLoading}
              className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition duration-200 disabled:bg-gray-400 flex items-center">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Fetching...' : 'Refresh Contact List'}
            </button>
            <p className="text-sm text-gray-600 italic">
              Displaying {contacts.length} synced contact records.
            </p>
          </div>

          {/* Status and Error Handling */}
          {renderStatus()}

          {/* Data Table */}
          <div className="table-container overflow-x-auto rounded-xl border border-gray-200 shadow-inner">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {['First Name', 'Last Name', 'Email', 'Job Title', 'Company'].map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {renderTableBody()}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
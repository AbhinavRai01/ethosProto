import React, { useState } from 'react';

const TimelineSummary = ({ predictions, userName }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const formatPredictionsForApi = (preds) => {
        let text = '';
        for (const period in preds) {
            text += `${period} (${preds[period].timeRange}): `;
            const events = preds[period].events.map(e => 
                `${e.location} at ${e.time}:00 (${(e.probability * 100).toFixed(1)}%)`
            );
            text += events.join(', ') + '; ';
        }
        return text;
    };

    const handleSummarize = async () => {
        setIsLoading(true);
        setError(null);
        setSummary('');

        const formattedData = formatPredictionsForApi(predictions);

        const systemPrompt = `You are a campus security analyst. Your task is to summarize a user's predicted daily schedule based on probabilistic data. The summary should be a concise, professional paragraph of 5-6 sentences. Focus on the most likely locations during the three main periods of the day: Morning, Daytime, and Evening. Do not mention the probabilities, just the locations.`;
        
        const userQuery = `Summarize the following predicted schedule for user ${userName}: ${formattedData}`;
        
        const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("API Error Response:", errorBody);
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
                setSummary(text);
            } else {
                console.error("No text in API response:", result);
                throw new Error("No summary was generated.");
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-8 text-center">
            <button 
                onClick={handleSummarize} 
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Generating Summary...' : 'Generate Summary'}
            </button>
            
            {summary && (
                <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg text-left">
                    <h4 className="text-lg font-semibold text-gray-100 mb-2">Generated Summary</h4>
                    <p className="text-gray-300 leading-relaxed">{summary}</p>
                </div>
            )}
            
            {error && <p className="mt-4 text-red-400">Error: {error}</p>}
        </div>
    );
};

export default TimelineSummary;


import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const TimelineSummary = ({ predictions, userName }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        socket.on('summary_chunk', (data) => {
            setIsLoading(false); 
            setSummary(prevSummary => prevSummary + data.text);
        });

        socket.on('stream_end', () => {
            setIsLoading(false);
        });
        
        socket.on('stream_error', (data) => {
            setError(data.error);
            setIsLoading(false);
        });

        return () => {
            socket.off('summary_chunk');
            socket.off('stream_end');
            socket.off('stream_error');
        };
    }, []);

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

    const handleSummarize = () => {
        setIsLoading(true);
        setError(null);
        setSummary('');

        const formattedData = formatPredictionsForApi(predictions);
        socket.emit('summarize_stream', { formattedData, userName });
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




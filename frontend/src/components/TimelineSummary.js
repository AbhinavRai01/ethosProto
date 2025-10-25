import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const renderMarkdown = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null;
    
    const flushList = () => {
        if (currentList.length > 0) {
            elements.push(
                listType === 'ul' ? (
                    <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-gray-300 ml-4">
                        {currentList}
                    </ul>
                ) : (
                    <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 mb-4 text-gray-300 ml-4">
                        {currentList}
                    </ol>
                )
            );
            currentList = [];
            listType = null;
        }
    };
    
    lines.forEach((line, idx) => {
        if (line.startsWith('### ')) {
            flushList();
            elements.push(
                <h3 key={idx} className="text-lg font-semibold text-purple-300 mt-4 mb-2">
                    {line.slice(4)}
                </h3>
            );
        } else if (line.startsWith('## ')) {
            flushList();
            elements.push(
                <h2 key={idx} className="text-xl font-bold text-purple-300 mt-4 mb-2">
                    {line.slice(3)}
                </h2>
            );
        } else if (line.startsWith('# ')) {
            flushList();
            elements.push(
                <h1 key={idx} className="text-2xl font-bold text-purple-300 mt-4 mb-3">
                    {line.slice(2)}
                </h1>
            );
        }
        else if (line.match(/^[*-]\s+(.+)/)) {
            const content = line.replace(/^[*-]\s+/, '');
            if (listType !== 'ul') {
                flushList();
                listType = 'ul';
            }
            const parts = content.split(/(\*\*.+?\*\*)/g);
            const rendered = parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-semibold text-gray-100">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
            currentList.push(<li key={idx}>{rendered}</li>);
        }
        else if (line.match(/^\d+\.\s+(.+)/)) {
            const content = line.replace(/^\d+\.\s+/, '');
            if (listType !== 'ol') {
                flushList();
                listType = 'ol';
            }
            const parts = content.split(/(\*\*.+?\*\*)/g);
            const rendered = parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-semibold text-gray-100">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
            currentList.push(<li key={idx}>{rendered}</li>);
        }
        else if (line.trim()) {
            flushList();
            const parts = line.split(/(\*\*.+?\*\*)/g);
            const rendered = parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-semibold text-gray-100">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
            elements.push(
                <p key={idx} className="text-gray-300 mb-3 leading-relaxed">
                    {rendered}
                </p>
            );
        }
        else { 
            flushList(); 
        }
    });
    
    flushList(); 
    return <div className="markdown-content">{elements}</div>; 
};

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
                className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Generating Summary...' : 'Generate Daily Summary'}
            </button>
            
            {summary && (
                <div className="mt-6 p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-left">
                    <div className="flex items-center mb-4">
                        <h4 className="text-xl font-semibold text-purple-400">Behavioral Analysis</h4>
                        {isLoading && (
                            <span className="ml-3 inline-block w-2 h-4 bg-purple-400 animate-pulse"></span>
                        )}
                    </div>
                    <div className="prose prose-invert max-w-none">
                        {renderMarkdown(summary)}
                    </div>
                </div>
            )}
            
            {isLoading && !summary && (
                <div className="mt-6 flex items-center justify-center space-x-2">
                    <span className="text-sm text-gray-400">Analyzing behavior patterns...</span>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
            )}
            
            {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-400">Error: {error}</p>
                </div>
            )}
        </div>
    );
};

export default TimelineSummary;
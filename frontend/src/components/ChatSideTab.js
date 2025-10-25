import React, { useState, useEffect, useRef } from 'react';
import { sendDialogflowQuery, NameSearchResults, TimelineResults, GenerateTimelineResult, IdSearchResult, FaceIdSearchResult } from '../api/dialogflowApi';

const ChatSideTab = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { sender: 'bot', type: 'text', content: 'How can I assist you today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        const userMessage = { sender: 'user', type: 'text', content: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            const result = await sendDialogflowQuery(query);
            const botMessage = {
                sender: 'bot',
                type: result.type,
                content: result.content
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error submitting query:", error);
            setMessages(prev => [...prev, { sender: 'bot', type: 'text', content: 'An unexpected error occurred.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (msg) => {
        switch (msg.type) {
            case 'name_search':
                console.log("Rendering name search results:", msg);
                return <NameSearchResults results={msg.content} />;
            case 'timeline':
                const { results, Hour } = msg.content;
                return <TimelineResults results={results} Hour={Hour} />;
            case 'faceid_search':
                return <FaceIdSearchResult result={msg.content} />;
            case 'id_search':
                return <IdSearchResult result={msg.content} />;
            case 'generate_timeline':
                const { results: timelineResults, date } = msg.content;
                return <GenerateTimelineResult results={timelineResults} date={date} />;
            case 'error':
            case 'text':
            default:
                return <p className="text-sm leading-relaxed">{msg.content}</p>;
        }
    };

    return (
        <>
            <div 
                className={`fixed top-1/2 right-0 transform -translate-y-1/2 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-[-384px]' : 'translate-x-0'}`}
            >
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-purple-600/80 text-white p-4 rounded-l-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 relative overflow-hidden group"
                    aria-label="Toggle chat panel"
                >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </button>
            </div>

            <div
                className={`fixed top-0 right-0 h-full w-96 bg-gray-900/80 bg-gradient-to-b from-gray-900 to-black/50 backdrop-blur-lg border-l border-purple-500/20 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-purple-500/20 flex justify-between items-center bg-black/20">
                        <h3 className="text-xl font-bold text-white tracking-wider">AskMeBro</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors" aria-label="Close chat panel">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`w-full max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700/50 text-gray-200 rounded-bl-none'}`}>
                                    {renderMessageContent(msg)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                 <div className="bg-gray-700/50 text-gray-200 rounded-2xl p-3 px-4 rounded-bl-none">
                                     <div className="flex items-center space-x-2">
                                         <span className="text-sm text-gray-400">Thinking</span>
                                         <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                         <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                         <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                     </div>
                                 </div>
                             </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-purple-500/20 bg-black/20">
                        <form onSubmit={handleQuerySubmit} className="relative flex items-center">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., find user Neha"
                                className="w-full bg-gray-700/50 border-2 border-transparent rounded-full py-3 pl-5 pr-14 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-purple-600 rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Send query"
                                disabled={isLoading}
                            >
                                <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatSideTab;

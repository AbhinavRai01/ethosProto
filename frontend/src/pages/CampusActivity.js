import React, { useState, useEffect, useRef} from 'react';
import { fetchLocationDensity, fetchDepartmentDensity } from '../api/flaskApis';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:5000/');

const renderMarkdown = (text) => {
    if (!text) return null;
    const sanitizedText = text.replace(/<br><br>/g, '\n');
    
    const lines = sanitizedText.split('\n');
    
    // const lines = text.split('\n');
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
             if (elements.length > 0 && !line.trim() && elements[elements.length - 1].type !== 'br') {
             }
            flushList(); 
        }
    });
    
    flushList(); 
    return <div className="markdown-content">{elements}</div>; 
};


const CampusActivity = () => {
    const [selectedDate, setSelectedDate] = useState("2025-08-25");
    const [isLoading, setIsLoading] = useState(false);
    const [densityData, setDensityData] = useState(null);
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedDepartment, setSelectedDepartment] = useState("all");

    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    const [dailySummary, setDailySummary] = useState('');
    const [isDailySummaryLoading, setIsDailySummaryLoading] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false); 
    const intervalRef = useRef(null); 

    const [isComparing, setIsComparing] = useState(false);
    const [compareHour1, setCompareHour1] = useState(9); 
    const [compareHour2, setCompareHour2] = useState(14); 

    const departments = ["Admin", "BIO", "Chemistry", "CIVIL", "CSE", "ECE", "EEE", "Maths", "MECH", "Physics"];

    useEffect(() => {
        socket.on('connect', () => console.log('Socket.IO connected'));
        socket.on('heatmap_summary_chunk', (data) => setSummary(prev => prev + data.text));
        socket.on('heatmap_stream_end', () => setIsSummaryLoading(false));
        socket.on('daily_summary_chunk', (data) => setDailySummary(prev => prev + data.text));
        socket.on('daily_summary_end', () => setIsDailySummaryLoading(false));
        socket.on('stream_error', (data) => {
            console.error('Stream Error:', data.error);
            if (data.type === 'hourly') setSummary('An error occurred generating hourly summary.');
            else if (data.type === 'daily') setDailySummary('An error occurred generating daily summary.');
            else { 
                 setSummary('An error occurred.');
                 setDailySummary('An error occurred.');
            }
            setIsSummaryLoading(false);
            setIsDailySummaryLoading(false);
        });

        return () => {
            socket.off('connect');
            socket.off('heatmap_summary_chunk');
            socket.off('heatmap_stream_end');
            socket.off('daily_summary_chunk');
            socket.off('daily_summary_end');
            socket.off('stream_error');
            if (intervalRef.current) clearInterval(intervalRef.current); 
        };
    }, []); 

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setSelectedHour(prevHour => (prevHour + 1) % 24); 
            }, 1000); 
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current); 
                intervalRef.current = null;
            }
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying]); 


    const _aggregateDailyData = (data) => {
        const aggregated = {};
        for (const location in data) {
            if (Array.isArray(data[location])) {
                let peakCount = 0;
                let peakHour = 0;
                let totalCount = 0;

                data[location].forEach(hourData => {
                    const count = hourData.user_count;
                    totalCount += count;
                    if (count > peakCount) {
                        peakCount = count;
                        const hourMatch = hourData.time_window.match(/^(\d{2}):/);
                        if (hourMatch) peakHour = parseInt(hourMatch[1], 10);
                    }
                });

                if (totalCount > 0) {
                     const formattedPeakHour = peakHour === 0 ? '12 AM' : peakHour === 12 ? '12 PM' : peakHour > 12 ? `${peakHour - 12} PM` : `${peakHour} AM`;
                    aggregated[location] = { peakHour: formattedPeakHour, peakCount: peakCount, totalUsers: totalCount };
                }
            }
        }
         const sortedLocations = Object.entries(aggregated).sort(([, a], [, b]) => b.totalUsers - a.totalUsers);
         return Object.fromEntries(sortedLocations); 
    };


    const triggerDailySummary = (fetchedData) => {
        if (!fetchedData || isDailySummaryLoading) return;
        setDailySummary(''); 
        setIsDailySummaryLoading(true);
        const aggregatedData = _aggregateDailyData(fetchedData);
        const dayName = new Date(selectedDate + 'T12:00:00').toLocaleString('en-US', { weekday: 'long' });
        socket.emit('summarize_daily_heatmap', {
            day: dayName, department: selectedDepartment, dailyData: JSON.stringify(aggregatedData)
        });
    };

    const triggerHourlySummary = (currentHour) => { 
        const hourToSummarize = typeof currentHour === 'number' ? currentHour : selectedHour; 
        if (!densityData || isSummaryLoading) return;
        setSummary('');
        setIsSummaryLoading(true);
        const currentHourData = {};
        for (const location in densityData) {
            if (Array.isArray(densityData[location])) {
                const hourData = densityData[location].find(d => {
                     const hourMatch = d.time_window.match(/^(\d{2}):/);
                     return hourMatch ? parseInt(hourMatch[1], 10) === hourToSummarize : false;
                 });
                if (hourData) currentHourData[location] = hourData.user_count;
            }
        }
        const dayName = new Date(selectedDate + 'T12:00:00').toLocaleString('en-US', { weekday: 'long' });
        socket.emit('summarize_heatmap', {
            day: dayName, hour: hourToSummarize, department: selectedDepartment, density: JSON.stringify(currentHourData)
        });
    };

    const handleFetchDensity = async () => {
        if (!selectedDate) return;
        setIsPlaying(false); 
        setIsComparing(false); 
        setIsLoading(true);
        setDensityData(null);
        setSummary('');
        setDailySummary(''); 
        setIsDailySummaryLoading(false); 
        setIsSummaryLoading(false); 
        try {
            const dateObj = new Date(selectedDate + 'T12:00:00');
            const dayName = dateObj.toLocaleString('en-US', { weekday: 'long' });
            let data;
            if (selectedDepartment === "all") data = await fetchLocationDensity(dayName);
            else data = await fetchDepartmentDensity(dayName, selectedDepartment);
            setDensityData(data);
            if (data) {
                triggerDailySummary(data); 
                triggerHourlySummary(selectedHour); 
            }
        } catch (error) {
            console.error("Failed to fetch density data:", error);
            setDensityData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (densityData && !isPlaying) triggerHourlySummary(selectedHour); 
        if (isPlaying) setSummary('');
    }, [selectedHour, isPlaying, densityData]); 

    const handleSliderChange = (e) => {
        setIsPlaying(false); 
        setSelectedHour(Number(e.target.value));
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8 md:p-12">
            <div className="w-full max-w-7xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl font-bold text-white">Campus Activity Hotspots</h1>
                    <p className="mt-2 text-lg text-gray-400">
                        View predicted user density across campus for any day and time.
                    </p>
                </header>

                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
                         <div className="w-full sm:w-auto flex-grow sm:flex-grow-0">
                            <label htmlFor="date-select" className="sr-only">Select a date</label>
                            <input type="date" id="date-select" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min="2025-08-25" max="2025-09-27" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                        </div>
                         <div className="w-full sm:w-auto flex-grow sm:flex-grow-0">
                            <label htmlFor="dept-select" className="sr-only">Select a Department</label>
                            <select id="dept-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                <option value="all">All Users</option>
                                {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                            </select>
                        </div>
                        <button onClick={handleFetchDensity} disabled={isLoading || !selectedDate} className="w-full sm:w-auto flex-shrink-0 px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {isLoading ? 'Fetching...' : 'Get Location Density'}
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    {isLoading && <p className="text-center text-gray-400">Loading density data...</p>}
                    {!isLoading && densityData && (
                        <>
                            <GeminiDailySummaryDisplay
                                summary={dailySummary}
                                isSummaryLoading={isDailySummaryLoading}
                                selectedDate={selectedDate}
                                selectedDepartment={selectedDepartment}
                            />
                            
                            <HourSelector 
                                selectedHour={selectedHour} 
                                onHourChange={handleSliderChange} 
                                isPlaying={isPlaying}
                                onPlayPause={() => setIsPlaying(!isPlaying)} 
                            />

                            {isComparing ? (
                                <ComparisonSelector
                                    hour1={compareHour1}
                                    setHour1={setCompareHour1}
                                    hour2={compareHour2}
                                    setHour2={setCompareHour2}
                                    onCancel={() => { setIsComparing(false); }} 
                                    densityData={densityData}
                                />
                            ) : (
                                densityData && (
                                    <div className="mt-6 flex justify-center">
                                        <button onClick={() => setIsComparing(true)} className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                            Compare Hours
                                        </button>
                                    </div>
                                )
                            )}
                            
                            <div className="space-y-8 mt-6">
                                <HeatmapDisplay 
                                    densityData={densityData} 
                                    selectedHour={selectedHour}
                                />
                                {!isPlaying && (
                                    <GeminiHourlySummaryDisplay
                                        summary={summary}
                                        isSummaryLoading={isSummaryLoading}
                                        dayName={new Date(selectedDate + 'T12:00:00').toLocaleString('en-US', { weekday: 'long' })}
                                        selectedHour={selectedHour}
                                    />
                                )}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <ActivityChart densityData={densityData} selectedHour={selectedHour} type="bar" title="Density (Bar Chart)" />
                                    <ActivityChart densityData={densityData} selectedHour={selectedHour} type="pie" title="Density (Pie Chart)" />
                                </div>
                            </div>
                        </>
                    )}
                    {!isLoading && !densityData && (
                        <p className="text-center text-gray-500 py-16">Please select a date and fetch data to see visualizations.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const HourSelector = ({ selectedHour, onHourChange, isPlaying, onPlayPause }) => ( 
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mt-8">
        <label htmlFor="hour-slider" className="block text-center text-lg font-medium text-gray-300 mb-3">
            Selected Time: <span className="font-bold text-purple-400">{String(selectedHour).padStart(2, '0')}:00</span>
        </label>
        <div className="flex items-center space-x-4">
             <button onClick={onPlayPause} className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500`} aria-label={isPlaying ? "Pause animation" : "Play animation"}>
                {isPlaying ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 011-1h1a1 1 0 110 2H8a1 1 0 01-1-1zm5 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" clipRule="evenodd" /></svg>) 
                             : (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>)}
            </button>
            <input id="hour-slider" type="range" min="0" max="23" value={selectedHour} onChange={onHourChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
        </div>
    </div>
);

const MiniHeatmap = ({ densityData, hour, title }) => {
    const heatmapRef = useRef(null);
    const heatmapInstanceRef = useRef(null);

     useEffect(() => {
        const scriptId = 'heatmap-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://cdn.jsdelivr.net/npm/heatmap.js/build/heatmap.min.js';
            script.async = true;
            document.body.appendChild(script);

             return () => {
                const existingScript = document.getElementById(scriptId);
            };
        }
    }, []);

    useEffect(() => {
         if (window.h337 && heatmapRef.current && densityData) {
              if (heatmapInstanceRef.current) {
                   heatmapRef.current.innerHTML = ''; 
              }

            heatmapInstanceRef.current = window.h337.create({
                container: heatmapRef.current,
                radius: 35,
                maxOpacity: .7,
                minOpacity: 0.1,
                blur: .85
            });

            const locationCoords = {
                'HOSTEL': { x: 215, y: 110 }, 'GYM': { x: 275, y: 138 }, 'ADMIN_LOBBY': { x: 315, y: 83 },
                'LIBRARY': { x: 323, y: 153 }, 'CAF': { x: 285, y: 208 }, 'AUDITORIUM': { x: 380, y: 238 },
                'LAB': { x: 400, y: 175 }, 'SEMINAR_ROOM': { x: 390, y: 85 }, 'ENG': { x: 430, y: 130 },
            };

            const points = [];
            let max = 0;
            for (const location in densityData) {
                if (Array.isArray(densityData[location])) {
                     const hourData = densityData[location].find(d => {
                         const hourMatch = d.time_window.match(/^(\d{2}):/);
                         return hourMatch ? parseInt(hourMatch[1], 10) === hour : false;
                     });
                    if (hourData && locationCoords[location]) {
                        const value = hourData.user_count;
                        max = Math.max(max, value);
                        points.push({ x: locationCoords[location].x, y: locationCoords[location].y, value: value });
                    }
                }
            }
            heatmapInstanceRef.current.setData({ max: max || 1, data: points });
        }

    }, [densityData, hour]);

    return (
        <div className="w-full">
             <h4 className="text-md font-semibold text-teal-300 mb-2 text-center">{title}</h4>
            <div 
                ref={heatmapRef} 
                className="w-full h-[300px] bg-center bg-no-repeat bg-contain rounded-md border border-gray-700"
                style={{ backgroundImage: `url('https://i.postimg.cc/wx5J8F6P/Campus-Map.png')` }}
            ></div>
        </div>
    );
};

const HeatmapDisplay = ({ densityData, selectedHour }) => {
    const heatmapContainerRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/heatmap.js/build/heatmap.min.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { if (script.parentNode) document.body.removeChild(script); };
    }, []);

    useEffect(() => {
        if (window.h337 && heatmapContainerRef.current && densityData) {
            heatmapContainerRef.current.innerHTML = '';
            const heatmapInstance = window.h337.create({
                container: heatmapContainerRef.current, radius: 70, maxOpacity: .6, minOpacity: 0, blur: .90
            });
            const locationCoords = {
                'HOSTEL': { x: 440, y: 220 }, 'GYM': { x: 562, y: 275 }, 'ADMIN_LOBBY': { x: 650, y: 165 },
                'LIBRARY': { x: 665, y: 305 }, 'CAF': { x: 570, y: 415 }, 'AUDITORIUM': { x: 760, y: 475 },
                'LAB': { x: 800, y: 350 }, 'SEMINAR_ROOM': { x: 780, y: 150 }, 'ENG': { x: 880, y: 250 },
            };
            const points = [];
            let max = 0;
            for (const location in densityData) {
                if (Array.isArray(densityData[location])) {
                     const hourData = densityData[location].find(d => {
                         const hourMatch = d.time_window.match(/^(\d{2}):/);
                         return hourMatch ? parseInt(hourMatch[1], 10) === selectedHour : false;
                     });
                    if (hourData && locationCoords[location]) {
                        const value = hourData.user_count;
                        max = Math.max(max, value);
                        points.push({ x: locationCoords[location].x, y: locationCoords[location].y, value: value });
                    }
                }
            }
            heatmapInstance.setData({ max: max || 1, data: points });
        }
    }, [densityData, selectedHour]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-purple-400 mb-4">Activity Heatmap</h3>
            <div ref={heatmapContainerRef} className="w-full h-[600px] bg-center bg-no-repeat bg-contain rounded-md" style={{ backgroundImage: `url('https://i.postimg.cc/wx5J8F6P/Campus-Map.png')` }}></div>
        </div>
    );
};

const GeminiHourlySummaryDisplay = ({ summary, isSummaryLoading, dayName, selectedHour }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-purple-400">Short Notes for {String(selectedHour).padStart(2, '0')}:00</h3>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-md min-h-[100px] prose prose-invert prose-p:text-gray-300 prose-p:my-2 text-gray-300">
            {isSummaryLoading && !summary && (<div className="flex items-center space-x-2"><span className="text-sm text-gray-400">Generating hourly notes...</span><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]"></div></div>)}
             {summary && renderMarkdown(summary)} 
             {isSummaryLoading && summary && (<span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1"></span>)}
            {!isSummaryLoading && !summary && (<p className="text-gray-500">Hourly summary for {dayName} at {String(selectedHour).padStart(2,'0')}:00 will appear here.</p>)}
        </div>
    </div>
);

const GeminiDailySummaryDisplay = ({ summary, isSummaryLoading, selectedDate, selectedDepartment }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-purple-400">
                Overview of {selectedDate} for {selectedDepartment === 'all' ? 'all Users' : selectedDepartment + ' department'}
            </h3>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-md min-h-[120px]">
            {summary ? (
                <div className="prose prose-invert max-w-none">
                    {renderMarkdown(summary)}
                    {isSummaryLoading && (<span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1"></span>)}
                </div>
            ) : (<p className="text-gray-500">{isSummaryLoading ? 'Generating summary...' : `Summary for ${selectedDate} will appear here after fetching data.`}</p>)}
             {isSummaryLoading && !summary && (<div className="flex items-center space-x-2 mt-2"><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]"></div></div>)}
        </div>
    </div>
);

const ComparisonTable = ({ densityData, hour1, hour2 }) => {
    const locations = ['HOSTEL', 'GYM', 'ADMIN_LOBBY', 'LIBRARY', 'CAF', 'AUDITORIUM', 'LAB', 'SEMINAR_ROOM', 'ENG'];

    const getDataForHour = (hour, location) => {
        if (!densityData || !densityData[location] || !Array.isArray(densityData[location])) {
            return 0;
        }
        const hourData = densityData[location].find(d => {
            const hourMatch = d.time_window.match(/^(\d{2}):/);
            return hourMatch ? parseInt(hourMatch[1], 10) === hour : false;
        });
        return hourData ? hourData.user_count : 0;
    };

    const comparisonData = locations.map(location => {
        const count1 = getDataForHour(hour1, location);
        const count2 = getDataForHour(hour2, location);
        const difference = count2 - count1;
        return { location, count1, count2, difference };
    });

    return (
        <div className="mt-8">
            <h4 className="text-lg font-semibold text-teal-300 mb-4 text-center">User Count Comparison</h4>
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-sm font-bold text-teal-400 border-b border-gray-700 pb-2 mb-2">
                    <div className="text-left">Location</div>
                    <div className="text-center">{String(hour1).padStart(2, '0')}:00</div>
                    <div className="text-center">{String(hour2).padStart(2, '0')}:00</div>
                    <div className="text-center">Difference</div>
                </div>
                <div className="space-y-2">
                    {comparisonData.map(({ location, count1, count2, difference }) => (
                        <div key={location} className="grid grid-cols-4 gap-4 items-center text-gray-300 text-sm">
                            <div className="font-medium">{location}</div>
                            <div className={`text-center font-mono ${count1 > count2 ? 'text-green-400' : count1 < count2 ? 'text-red-400' : ''}`}>
                                {count1}
                            </div>
                            <div className={`text-center font-mono ${count2 > count1 ? 'text-green-400' : count2 < count1 ? 'text-red-400' : ''}`}>
                                {count2}
                            </div>
                            <div className={`text-center font-mono ${difference > 0 ? 'text-green-400' : difference < 0 ? 'text-red-400' : ''}`}>
                                {difference > 0 ? `+${difference}` : difference}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const ComparisonSelector = ({ hour1, setHour1, hour2, setHour2, onCancel, densityData }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-teal-500/50 mt-6">
        <h3 className="text-xl font-semibold text-teal-300 mb-6 text-center">Compare Activity Between Two Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"> 
             <div className="space-y-4">
                 <label htmlFor="compare-hour-1" className="block text-sm font-medium text-gray-300 mb-1">
                     First Hour: <span className="font-bold text-teal-300">{String(hour1).padStart(2, '0')}:00</span>
                 </label>
                 <input id="compare-hour-1" type="range" min="0" max="23" value={hour1} onChange={(e) => setHour1(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                 <MiniHeatmap densityData={densityData} hour={hour1} title={`${String(hour1).padStart(2, '0')}:00 Heatmap`} />
            </div>
             <div className="space-y-4">
                 <label htmlFor="compare-hour-2" className="block text-sm font-medium text-gray-300 mb-1">
                     Second Hour: <span className="font-bold text-teal-300">{String(hour2).padStart(2, '0')}:00</span>
                 </label>
                 <input id="compare-hour-2" type="range" min="0" max="23" value={hour2} onChange={(e) => setHour2(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                 <MiniHeatmap densityData={densityData} hour={hour2} title={`${String(hour2).padStart(2, '0')}:00 Heatmap`} />
            </div>
        </div>
        
        <ComparisonTable densityData={densityData} hour1={hour1} hour2={hour2} />

        <div className="flex justify-center gap-4 mt-8"> 
            <button onClick={onCancel} className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                 Cancel
             </button>
        </div>
         {hour1 === hour2 && <p className="text-xs text-red-400 text-center mt-2">Please select two different hours to compare.</p>}
    </div>
);

const LOCATION_COLORS = {
    'HOSTEL': 'hsla(10, 50%, 55%, 0.7)', 'GYM': 'hsla(40, 50%, 55%, 0.7)', 'ADMIN_LOBBY': 'hsla(70, 50%, 50%, 0.7)',
    'LIBRARY': 'hsla(100, 50%, 50%, 0.7)', 'CAF': 'hsla(140, 50%, 55%, 0.7)', 'AUDITORIUM': 'hsla(190, 50%, 50%, 0.7)',
    'LAB': 'hsla(230, 50%, 60%, 0.7)', 'SEMINAR_ROOM': 'hsla(280, 50%, 60%, 0.7)', 'ENG': 'hsla(320, 50%, 60%, 0.7)',
    'DEFAULT': 'hsla(0, 0%, 70%, 0.7)'
};

const ActivityChart = ({ densityData, selectedHour, type, title }) => {
    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { if (script.parentNode) document.body.removeChild(script); };
    }, []);

    useEffect(() => {
        if (window.Chart && chartContainerRef.current && densityData) {
            const chartData = [];
            for (const location in densityData) {
                if (Array.isArray(densityData[location])) {
                     const hourData = densityData[location].find(d => {
                         const hourMatch = d.time_window.match(/^(\d{2}):/);
                         return hourMatch ? parseInt(hourMatch[1], 10) === selectedHour : false;
                     });
                    if (hourData && hourData.user_count > 0) chartData.push({ location: location, count: hourData.user_count });
                }
            }
            const locationOrder = ['HOSTEL', 'GYM', 'ADMIN_LOBBY', 'LIBRARY', 'CAF', 'AUDITORIUM', 'LAB', 'SEMINAR_ROOM', 'ENG'];
            if (type === 'bar') chartData.sort((a, b) => locationOrder.indexOf(a.location) - locationOrder.indexOf(b.location));
            else chartData.sort((a, b) => b.count - a.count);
            const labels = chartData.map(d => d.location);
            const data = chartData.map(d => d.count);
            const backgroundColors = labels.map(label => LOCATION_COLORS[label] || LOCATION_COLORS['DEFAULT']);
            const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));
            const options = {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: type === 'pie', position: 'right', labels: { color: '#9ca3af', sort: (a, b) => locationOrder.indexOf(a.text) - locationOrder.indexOf(b.text) } } },
                scales: type === 'bar' ? { indexAxis: 'y', x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(156, 163, 175, 0.1)' } }, y: { ticks: { color: '#9ca3af' }, grid: { display: false } } } : {}
            };
            const ctx = chartContainerRef.current.getContext('2d');
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            chartInstanceRef.current = new window.Chart(ctx, {
                type: type,
                data: { labels: labels, datasets: [{ label: `User Count at ${String(selectedHour).padStart(2, '0')}:00`, data: data, backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1 }] },
                options: options
            });
        }
    }, [densityData, selectedHour, type]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-purple-400 mb-4">{title}</h3>
            <div className="relative h-[600px]"><canvas ref={chartContainerRef}></canvas></div>
        </div>
    );
};

export default CampusActivity;
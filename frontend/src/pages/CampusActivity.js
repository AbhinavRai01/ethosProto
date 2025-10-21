import React, { useState, useEffect, useRef } from 'react';
import { fetchLocationDensity } from '../api/flaskApis';

const CampusActivity = () => {
    const [selectedDay, setSelectedDay] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [densityData, setDensityData] = useState(null);
    const [selectedHour, setSelectedHour] = useState(12);

    const handleFetchDensity = async () => {
        if (!selectedDay) return;
        setIsLoading(true);
        setDensityData(null);
        try {
            const data = await fetchLocationDensity(selectedDay);
            setDensityData(data);
        } catch (error) {
            console.error("Failed to fetch density data:", error);
            setDensityData(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8 md:p-12">
            <div className="w-full max-w-6xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl font-bold text-white">Campus Activity Hotspots</h1>
                    <p className="mt-2 text-lg text-gray-400">
                        View predicted user density across campus for any day and time.
                    </p>
                </header>

                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full sm:w-auto">
                            <label htmlFor="day-select" className="sr-only">Select a day</label>
                            <select
                                id="day-select"
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="" disabled>Select a day</option>
                                <option>Monday</option>
                                <option>Tuesday</option>
                                <option>Wednesday</option>
                                <option>Thursday</option>
                                <option>Friday</option>
                                <option>Saturday</option>
                                <option>Sunday</option>
                            </select>
                        </div>
                        <button
                            onClick={handleFetchDensity}
                            disabled={isLoading || !selectedDay}
                            className="w-full sm:w-auto flex-shrink-0 px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Fetching...' : 'Get Location Density'}
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    {isLoading && <p className="text-center text-gray-400">Loading density data...</p>}
                    {!isLoading && densityData && (
                        <>
                            <HourSelector selectedHour={selectedHour} setSelectedHour={setSelectedHour} />
                            <div className="space-y-8 mt-6">
                                <HeatmapDisplay densityData={densityData} selectedHour={selectedHour} />
                                <ActivityChart densityData={densityData} selectedHour={selectedHour} />
                            </div>
                        </>
                    )}
                    {!isLoading && !densityData && (
                        <p className="text-center text-gray-500 py-16">Please select a day and fetch data to see visualizations.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const HourSelector = ({ selectedHour, setSelectedHour }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <label htmlFor="hour-slider" className="block text-center text-lg font-medium text-gray-300 mb-2">
            Selected Time: <span className="font-bold text-purple-400">{String(selectedHour).padStart(2, '0')}:00</span>
        </label>
        <input
            id="hour-slider"
            type="range"
            min="0"
            max="23"
            value={selectedHour}
            onChange={(e) => setSelectedHour(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
    </div>
);

const HeatmapDisplay = ({ densityData, selectedHour }) => {
    const heatmapContainerRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/heatmap.js/build/heatmap.min.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (window.h337 && heatmapContainerRef.current && densityData) {
            heatmapContainerRef.current.innerHTML = '';
            const heatmapInstance = window.h337.create({
                container: heatmapContainerRef.current,
                radius: 70,
                maxOpacity: .6,
                minOpacity: 0,
                blur: .90
            });

            const locationCoords = {
                'HOSTEL': { x: 380, y: 220 },
                'GYM': { x: 512, y: 275 },
                'ADMIN_LOBBY': { x: 600, y: 165 },
                'LIBRARY': { x: 615, y: 305 },
                'CAF': { x: 520, y: 415 },
                'AUDITORIUM': { x: 710, y: 475 },
                'LAB': { x: 750, y: 350 },
                'SEMINAR_ROOM': { x: 750, y: 160 },
                'ENG': { x: 880, y: 250 },
            };

            const points = [];
            let max = 0;
            for (const location in densityData) {
                const hourData = densityData[location].find(d => parseInt(d.time_window.split(':')[0]) === selectedHour);
                if (hourData && locationCoords[location]) {
                    const value = hourData.user_count;
                    max = Math.max(max, value);
                    points.push({
                        x: locationCoords[location].x,
                        y: locationCoords[location].y,
                        value: value
                    });
                }
            }
            heatmapInstance.setData({ max: max || 1, data: points });
        }
    }, [densityData, selectedHour]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-purple-400 mb-4">Activity Heatmap</h3>
            <div 
                ref={heatmapContainerRef} 
                className="w-full h-[600px] bg-center bg-no-repeat bg-contain rounded-md" 
                style={{ backgroundImage: `url('https://i.postimg.cc/wx5J8F6P/Campus-Map.png')` }}
            ></div>
        </div>
    );
};

const ActivityChart = ({ densityData, selectedHour }) => {
    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (window.Chart && chartContainerRef.current && densityData) {
            const chartData = [];
            for (const location in densityData) {
                const hourData = densityData[location].find(d => parseInt(d.time_window.split(':')[0]) === selectedHour);
                if (hourData) {
                    chartData.push({ location: location, count: hourData.user_count });
                }
            }

            chartData.sort((a, b) => b.count - a.count);

            const ctx = chartContainerRef.current.getContext('2d');
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            chartInstanceRef.current = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.map(d => d.location),
                    datasets: [{
                        label: `User Count at ${String(selectedHour).padStart(2, '0')}:00`,
                        data: chartData.map(d => d.count),
                        backgroundColor: 'rgba(167, 139, 250, 0.6)',
                        borderColor: 'rgba(167, 139, 250, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'x',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: 'rgba(156, 163, 175, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#9ca3af' },
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }, [densityData, selectedHour]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-purple-400 mb-4">Location Density Chart</h3>
            <div className="relative h-[600px]">
                <canvas ref={chartContainerRef}></canvas>
            </div>
        </div>
    );
};

export default CampusActivity;


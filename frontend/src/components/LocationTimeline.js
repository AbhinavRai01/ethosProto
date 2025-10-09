import React, { useState } from 'react';

export const LocationTimeline = ({ events }) => {
    const [timeframe, setTimeframe] = useState('monthly'); // 'monthly' or 'weekly'
    const [viewDate, setViewDate] = useState(new Date('2025-09-01T00:00:00Z'));

    const getMonthName = (date) => date.toLocaleString('default', { month: 'long' });

    let filteredEvents = [];
    let labels = [];
    let totalDuration = 1;

    if (timeframe === 'monthly') {
        const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);
        totalDuration = endOfMonth.getTime() - startOfMonth.getTime();
        
        filteredEvents = events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= startOfMonth && eventDate <= endOfMonth;
        });

        // Generate labels for every 5 days
        const daysInMonth = endOfMonth.getDate();
        for (let i = 1; i <= daysInMonth; i += 5) {
            labels.push({ day: i, position: (i - 1) / (daysInMonth - 1) * 100 });
        }
    } else { // weekly
        const endOfWeek = new Date('2025-09-28T23:59:59Z');
        const startOfWeek = new Date('2025-09-22T00:00:00Z');
        totalDuration = endOfWeek.getTime() - startOfWeek.getTime();

        filteredEvents = events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= startOfWeek && eventDate <= endOfWeek;
        });
        
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        labels = weekDays.map((day, index) => ({ day, position: (index / 6) * 100 }));
    }

    const calculatePosition = (timestamp) => {
        const eventDate = new Date(timestamp);
        let start;
        if (timeframe === 'monthly') {
            start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        } else {
             start = new Date('2025-09-22T00:00:00Z');
        }
        return ((eventDate.getTime() - start.getTime()) / totalDuration) * 100;
    };
    
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M21 21H3V3"/><path d="M12 12L3 20"/><path d="M18 6L3 21"/></svg>
                    Location Timeline
                </h4>
                <div className="flex items-center bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setTimeframe('monthly')} className={`px-3 py-1 text-sm font-semibold rounded-md transition ${timeframe === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Monthly</button>
                    <button onClick={() => setTimeframe('weekly')} className={`px-3 py-1 text-sm font-semibold rounded-md transition ${timeframe === 'weekly' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Weekly</button>
                </div>
            </div>

            <div className="relative h-24">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600"></div>
                <div className="relative w-full h-full">
                    {filteredEvents.map(event => (
                        <div key={event.id} className="group absolute top-1/2 -translate-y-1/2" style={{ left: `${calculatePosition(event.timestamp)}%` }}>
                            <div className="w-4 h-4 bg-gray-900 border-2 border-purple-500 rounded-full cursor-pointer"></div>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-gray-900 border border-gray-600 rounded-lg text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <p className="font-bold text-white capitalize">{event.type.replace(/_/g, ' ')}</p>
                                <p className="text-gray-300">{event.details}</p>
                                <p className="text-gray-400 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="absolute top-full left-0 w-full flex justify-between mt-2">
                    {labels.map(label => (
                        <span key={label.day} className="text-xs text-gray-400" style={{ position: 'absolute', left: `${label.position}%`, transform: 'translateX(-50%)' }}>
                            {label.day}
                        </span>
                    ))}
                </div>
            </div>
             <p className="text-center text-sm text-gray-400 mt-10">
                {timeframe === 'monthly' ? `Showing activity for ${getMonthName(viewDate)} 2025` : 'Showing activity for the last week of September'}
            </p>
        </div>
    );
};

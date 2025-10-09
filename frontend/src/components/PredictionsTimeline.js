import React from 'react';

// A small, reusable component to render each individual 8-hour timeline column.
const TimelineColumn = ({ title, items }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-100 mb-4 text-center">{title}</h3>
            <div className="relative">
                {/* The vertical line for this column */}
                <div className="absolute left-3 top-0 h-full w-px bg-gray-600"></div>
                
                {items.length > 0 ? items.map(item => (
                    <div key={item.id} className="relative pl-10 pb-2">
                        {/* The dot */}
                        <div className="absolute left-3 top-2.5 w-2.5 h-2.5 -ml-[5px] bg-indigo-500 rounded-full border border-gray-900"></div>
                        
                        {/* The content card (same compact style as before) */}
                        <div className="p-2 bg-gray-800 rounded-md border border-gray-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold text-gray-100">{item.location}</p>
                                    <p className="text-xs text-gray-400">
                                        Prob: {(item.probability * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                    <span className="text-xs font-medium text-indigo-300 bg-gray-700/50 px-2 py-1 rounded-full">
                                        {item.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : <p className="text-gray-500 text-center text-sm">No data</p>}
            </div>
        </div>
    );
};


const PredictionsTimeline = ({ items }) => {
    if (!items || items.length === 0) {
        return (
            <div className="text-center text-gray-400 mt-4 py-8">
                No prediction data available for the selected date.
            </div>
        );
    }

    // Split the 24-hour data into three 8-hour chunks
    const morningItems = items.slice(0, 8);      // 00:00 - 07:00
    const daytimeItems = items.slice(8, 16);     // 08:00 - 15:00
    const eveningItems = items.slice(16, 24);    // 16:00 - 23:00

    return (
        <div className="max-w-7xl mx-auto my-4 px-4 sm:px-0">
            {/* Main grid container: 1 column on mobile, 3 on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
                <TimelineColumn title="Morning (00-07)" items={morningItems} />
                <TimelineColumn title="Daytime (08-15)" items={daytimeItems} />
                <TimelineColumn title="Evening (16-23)" items={eveningItems} />
            </div>
        </div>
    );
};

export default PredictionsTimeline;
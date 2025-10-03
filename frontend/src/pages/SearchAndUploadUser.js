import { React, useState } from 'react';
import { Link } from 'react-router-dom';

const { searchEntityByName, searchEntityByFaceId, searchEntityByCardId } = require('../api/searchApis');
const { getUserById } = require('../api/userApi');

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('name');
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState('idle');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const handleSearch = async (page = 1) => {
        if (!query.trim()) return;
        setStatus('loading');
        if (page === 1) setResults([]);

        try {
            let response;
            switch (searchType) {
                case 'name':
                    response = await searchEntityByName(query, page);
                    break;
                case 'faceId':
                    response = await searchEntityByFaceId(query, page);
                    break;
                case 'cardId':
                    response = await searchEntityByCardId(query, page);
                    break;
                case 'entityId':
                    const user = await getUserById(query);
                    response = user ? [user] : [];
                    break;
                default:
                    response = [];
            }
            setResults(response);
            setCurrentPage(page);
            
            // Assuming API returns total count or you can calculate pages
            // Adjust this based on your actual API response structure
            // Example: if API returns { data: [...], total: 100, perPage: 10 }
            // setTotalPages(Math.ceil(response.total / response.perPage));
            
            // For now, showing simple pagination controls
            // You may need to adjust based on your API response
            if (response.length === 0 && page === 1) {
                setTotalPages(1);
            } else if (response.length > 0) {
                // This is a simple approach - you should get total pages from API
                setTotalPages(page + 1); // Assume there might be more pages
            }
            
            setStatus('success');
        } catch (error) {
            console.error("Error performing search:", error);
            setStatus('error');
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            handleSearch(newPage);
        }
    };

    const handleNewSearch = () => {
        setCurrentPage(1);
        setTotalPages(1);
        handleSearch(1);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-2xl mx-auto">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4">Search for a User</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition w-full sm:w-auto"
                        >
                            <option value="name">Name</option>
                            <option value="entityId">Entity ID</option>
                            <option value="faceId">Face ID</option>
                            <option value="cardId">Card ID</option>
                        </select>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Enter ${searchType.replace('Id', ' ID')}...`}
                            className="flex-grow p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition w-full"
                            onKeyPress={(e) => e.key === 'Enter' && handleNewSearch()}
                        />
                        <button
                            onClick={handleNewSearch}
                            disabled={status === 'loading' || !query}
                            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {status === 'loading' ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {/* Results Area */}
                    <div className="mt-8 min-h-[150px]">
                        {status === 'loading' && <p className="text-center text-gray-500">Searching... ⏳</p>}
                        {status === 'error' && <p className="text-center text-red-500">Search failed. Please try again.</p>}
                        {status === 'success' && results.length === 0 && <p className="text-center text-gray-500">No users found.</p>}
                        {status === 'success' && results.length > 0 && (
                            <>
                                <ul className="space-y-3">
                                    {results.map((user) => (
                                        <li key={user.entity_id || user._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <Link to={`/user/${user.entity_id}`} className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-indigo-700">{user.name}</p>
                                                    <p className="text-sm text-gray-600">{user.entity_id}</p>
                                                </div>
                                                <span className="text-sm text-gray-400">&#8594;</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-center gap-2 mt-6">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || status === 'loading'}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {currentPage > 2 && (
                                            <>
                                                <button
                                                    onClick={() => handlePageChange(1)}
                                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                                >
                                                    1
                                                </button>
                                                {currentPage > 3 && <span className="px-2 text-gray-500">...</span>}
                                            </>
                                        )}
                                        
                                        {currentPage > 1 && (
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                {currentPage - 1}
                                            </button>
                                        )}
                                        
                                        <button
                                            className="px-3 py-2 bg-indigo-600 text-white rounded-md font-semibold"
                                        >
                                            {currentPage}
                                        </button>
                                        
                                        {results.length > 0 && (
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={status === 'loading'}
                                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {currentPage + 1}
                                            </button>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={results.length === 0 || status === 'loading'}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>

                                <p className="text-center text-sm text-gray-500 mt-3">Page {currentPage}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
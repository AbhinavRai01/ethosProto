import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { 
    searchEntityByCardId,
    searchEntityByFaceId,
    searchEntityByName, 
    searchEntityByHashId,
} from '../api/searchApis';

import { searchEntityByFaceImage } from '../api/flaskApis';
import { getUserById } from '../api/userApi';

const StatusPill = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";
    const statusClasses = {
        'Active': 'bg-green-500/20 text-green-300',
        'On Leave': 'bg-yellow-500/20 text-yellow-300',
        'Inactive': 'bg-red-500/20 text-red-300'
    };
    return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-500/20 text-gray-300'}`}>{status}</span>;
};

const ImageUploader = ({ imageFile, setImageFile }) => {
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!imageFile) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };
    
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setImageFile(e.dataTransfer.files[0]);
        }
    }, [setImageFile]);
    
    const handleDragEvents = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    if (preview) {
        return (
            <div className="relative w-full p-3 h-32 bg-gray-800 border border-gray-700 rounded-md">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <button 
                    onClick={() => setImageFile(null)}
                    className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-700 text-white rounded-full p-1 leading-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        );
    }
    
    return (
        <div 
            className={`relative w-full p-3 h-32 bg-gray-800 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-gray-500'}`}
            onDrop={handleDrop}
            onDragEnter={handleDragEvents}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragEvents}
            onClick={() => document.getElementById('file-upload').click()}
        >
            <svg className="w-8 h-8 text-gray-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="text-sm text-gray-400">
                <span className="font-semibold text-purple-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, or WEBP</p>
            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </div>
    );
};


export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [searchType, setSearchType] = useState('name');
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState('idle');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    useEffect(() => {
        setQuery('');
        setImageFile(null);
        setResults([]);
        setStatus('idle');
        setCurrentPage(1);
        setTotalPages(1);
        setTotalResults(0);
    }, [searchType]);

    const handleSearch = async (page = 1) => {
        if (searchType !== 'faceImage' && !query.trim()) return;
        if (searchType === 'faceImage' && !imageFile) return;
        
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
                    response = await getUserById(query);
                    break;
                case 'hashId':
                    response = await searchEntityByHashId(query, page);
                    break;
                case 'faceImage':
                    const formData = new FormData();
                    formData.append('image', imageFile);
                    response = await searchEntityByFaceImage(formData, page);
                    break;
                default:
                    response = { results: [], totalPages: 1, totalResults: 0 };
            }
            setResults(response.results || (response ? [response] : []));
            setCurrentPage(page);
            setTotalPages(response.totalPages || 1);
            setTotalResults(response.totalResults || (response ? 1 : 0));
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

    const isSearchDisabled = status === 'loading' || (searchType === 'faceImage' ? !imageFile : !query.trim());

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8 md:p-12">
            <div className="w-full max-w-5xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold tracking-tight">Search Entities</h1>
                    <p className="mt-2 text-lg text-gray-400">Find students, faculty, or staff by a specific criterion.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 mb-10">
                     <div className="w-full md:w-1/4">
                         <label htmlFor="search-by" className="block text-sm font-medium text-gray-400 mb-2">Search By</label>
                         <select
                             id="search-by"
                             value={searchType}
                             onChange={(e) => setSearchType(e.target.value)}
                             className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                         >
                             <option value="name">Name</option>
                             <option value="entityId">Entity ID</option>
                             <option value="faceId">Face ID</option>
                             <option value="cardId">Card ID</option>
                             <option value="hashId">Hash ID</option>
                             <option value="faceImage">Face Image</option>
                         </select>
                     </div>
                     <div className="w-full md:flex-grow">
                         <label htmlFor="search-value" className="block text-sm font-medium text-gray-400 mb-2">Search Value</label>
                         {searchType === 'faceImage' ? (
                            <ImageUploader imageFile={imageFile} setImageFile={setImageFile} />
                         ) : (
                            <input
                                id="search-value"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Enter ${searchType.replace('Id', ' ID')}...`}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                onKeyPress={(e) => e.key === 'Enter' && handleNewSearch()}
                            />
                         )}
                     </div>
                     <div className="w-full md:w-auto self-end">
                         <label className="block text-sm font-medium text-transparent mb-2 hidden md:block">.</label>
                         <button
                             onClick={handleNewSearch}
                             disabled={isSearchDisabled}
                             className="w-full md:w-auto px-6 py-3 bg-purple-600 font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                         >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                             {status === 'loading' ? 'Searching...' : 'Search'}
                         </button>
                     </div>
                </div>

                <div>
                     <h2 className="text-2xl font-bold mb-4">Search Results</h2>
                     <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                         <table className="w-full min-w-full divide-y divide-gray-700">
                             <thead className="bg-gray-800">
                                 <tr>
                                     <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                                     <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Entity ID</th>
                                     <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                                     <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Department</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-700">
                                 {status === 'loading' && <tr><td colSpan="5" className="text-center p-8 text-gray-400">Loading results...</td></tr>}
                                 {status === 'error' && <tr><td colSpan="5" className="text-center p-8 text-red-400">Search failed. Please try again.</td></tr>}
                                 {status !== 'loading' && status !== 'error' && results.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-400">{status === 'idle' ? 'Enter a query to begin your search.' : 'No users found.'}</td></tr>}
                                 {status === 'success' && results.map((user) => (
                                     <tr key={user.entity_id || user._id} className="hover:bg-gray-700/50 transition-colors">
                                         <td className="px-6 py-4 whitespace-nowrap"><Link to={`/user/${user.entity_id}`} className="text-white hover:underline">{user.name}</Link></td>
                                         <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.entity_id}</td>
                                         <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.role}</td>
                                         <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.department}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </div>
                
                {totalResults > 0 && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-400">
                            Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(currentPage * 10, totalResults)}</span> of <span className="font-medium">{totalResults}</span> results
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || status === 'loading'} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">Previous</button>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || status === 'loading'} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
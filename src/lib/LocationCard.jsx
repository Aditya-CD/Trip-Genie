// LocationCard.jsx
import { useState, useEffect } from 'react';

const LocationCard = ({ location }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const UNSPLASH_ACCESS_KEY = 'fMVV8Dq5Vm4Y2bliQTOZ6eTjbM0nJA922c1JVJNtjeQ'; 
    
    useEffect(() => {
        const fetchImage = async () => {
            try {
                // First try with the specific query
                let query = location.image_query || location.name;
                let response = await fetch(
                    `https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`
                );
                
                let data = await response.json();
                
                // If no results, try a more generic search
                if (!data.results || data.results.length === 0) {
                    const genericQuery = location.category || 'travel';
                    response = await fetch(
                        `https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(genericQuery)}&client_id=${UNSPLASH_ACCESS_KEY}`
                    );
                    data = await response.json();
                }

                // Fallback to a placeholder if still no results
                setImageUrl(data.results?.[0]?.urls?.small || 'https://via.placeholder.com/400x300?text=Travel+Location');
            } catch (error) {
                console.error("Error fetching image:", error);
                setImageUrl('https://via.placeholder.com/400x300?text=Travel+Location');
            }
        };

        fetchImage();
    }, [location.image_query, location.name, location.category]);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="h-48 overflow-hidden">
                <img 
                    src={imageUrl} 
                    alt={location.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{location.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {location.category || 'Activity'}
                    </span>
                </div>
                {location.time && <p className="text-gray-500 text-sm mb-2">{location.time}</p>}
                {location.description && <p className="text-gray-600 mb-3">{location.description}</p>}
                {location.cost && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-600">{location.cost}</span>
                        <button className="text-sm text-blue-500 hover:text-blue-700">
                            View Details →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationCard;
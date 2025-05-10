import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [formData, setFormData] = useState({
    destination: "",
    budget: "20000",
    startDate: "",
    endDate: "",
    interests: [],
    travelStyle: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    setFormData(prev => ({
      ...prev,
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0]
    }));
  }, []);

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, destination: value }));
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      destination: suggestion.display_name
    }));
    setShowSuggestions(false);
  };

  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      interests: checked
        ? [...prev.interests, value]
        : prev.interests.filter((i) => i !== value),
    }));
  };

  const removeInterest = (item) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== item)
    }));
  };

  const addInterest = (item) => {
    if (!formData.interests.includes(item)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, item]
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.destination.trim()) newErrors.destination = "Please enter a destination";
    if (!formData.travelStyle) newErrors.travelStyle = "Please select travel style";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate("/itinerary", { state: { formData } });
  };

  const getBudgetLevel = () => {
    const budget = parseInt(formData.budget) || 0;
    return budget >= 50000 ? 'Luxury' :
      budget >= 20000 ? 'Comfort' :
        budget >= 10000 ? 'Standard' : 'Budget';
  };

  return (
    <div className="w-screen min-h-screen bg-[#FEF9F5] flex justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF7E5F]/10 rounded-full mix-blend-multiply blur-xl animate-[blob_7s_infinite]"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#00C9A7]/10 rounded-full mix-blend-multiply blur-xl animate-[blob_7s_infinite_2s]"></div>

      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full space-y-6 backdrop-blur-sm bg-white/80 p-8 rounded-xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] relative z-10"
      >
        <h1 className="text-5xl font-thin text-center text-black mb-2">
          Trip Genie 🌴
        </h1>
        <h2 className="text-3xl font-thin text-center text-[#FF7E5F] mb-8">
          Plan Your Perfect Trip
        </h2>

        {/* Destination - Floating Label */}
        <div className="relative z-0" ref={suggestionsRef}>
          <input
            id="destination"
            name="destination"
            type="text"
            value={formData.destination}
            onChange={handleDestinationChange}
            onFocus={() => setShowSuggestions(true)}
            className="block w-full pt-5 pb-1 px-0 mt-0 bg-transparent border-0 border-b border-[#00C9A7] appearance-none focus:outline-none focus:ring-0 focus:border-[#FF7E5F] peer"
            placeholder=" "
            required
            autoComplete="off"
          />
          <label
            htmlFor="destination"
            className="absolute text-sm text-[#2C3E50] duration-300 transform -translate-y-6 scale-75 top-4 z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Destination
          </label>
          {errors.destination && (
            <p className="absolute text-xs text-red-400 mt-1">{errors.destination}</p>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && formData.destination.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {isLoadingSuggestions ? (
                <div className="p-2 text-center text-gray-500">Loading...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion.display_name}
                  </div>
                ))
              ) : (
                <div className="p-2 text-center text-gray-500">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Budget Slider */}
        <div className="space-y-4 pt-2">
          <label className="text-sm font-light text-[#2C3E50] block">
            Budget: ₹{parseInt(formData.budget).toLocaleString('en-IN')}
            <span className="text-xs text-[#2C3E50]/50 ml-2">
              ({getBudgetLevel()})
            </span>
          </label>
          <input
            type="range"
            name="budget"
            min="0"
            max="100000"
            step="1000"
            value={formData.budget}
            onChange={handleChange}
            className="w-full h-2 bg-[#00C9A7]/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF7E5F]"
          />
          <div className="flex justify-between text-xs text-[#2C3E50]/50">
            <span>₹0</span>
            <span>₹50k</span>
            <span>₹100k</span>
          </div>
        </div>

        {/* Date Picker */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="relative z-0">
            <input
              id="startDate"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="block w-full pt-5 pb-1 px-0 mt-0 bg-transparent border-0 border-b border-[#00C9A7] appearance-none focus:outline-none focus:ring-0 focus:border-[#FF7E5F] peer"
              required
            />
            <label
              htmlFor="startDate"
              className="absolute text-sm text-[#2C3E50] duration-300 transform -translate-y-6 scale-75 top-4 z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Start Date
            </label>
            <div className="absolute right-0 bottom-3 pointer-events-none">
              <svg className="w-5 h-5 text-[#00C9A7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="relative z-0">
            <input
              id="endDate"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="block w-full pt-5 pb-1 px-0 mt-0 bg-transparent border-0 border-b border-[#00C9A7] appearance-none focus:outline-none focus:ring-0 focus:border-[#FF7E5F] peer"
              required
            />
            <label
              htmlFor="endDate"
              className="absolute text-sm text-[#2C3E50] duration-300 transform -translate-y-6 scale-75 top-4 z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              End Date
            </label>
            <div className="absolute right-0 bottom-3 pointer-events-none">
              <svg className="w-5 h-5 text-[#00C9A7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Interests - Tag Style */}
        <div className="space-y-2 pt-2">
          <label className="text-sm font-light text-[#2C3E50] block">Interests</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.interests.map(item => (
              <span key={item} className="flex items-center gap-1 px-3 py-1 bg-[#00C9A7]/10 text-[#00C9A7] rounded-full text-sm">
                {item}
                <button
                  type="button"
                  onClick={() => removeInterest(item)}
                  className="text-[#00C9A7] hover:text-[#FF7E5F] text-xs"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Food", "Culture", "Nature", "Nightlife", "History"]
              .filter(item => !formData.interests.includes(item))
              .map(item => (
                <button
                  type="button"
                  key={item}
                  onClick={() => addInterest(item)}
                  className="px-3 py-1 border border-[#00C9A7] text-[#00C9A7] rounded-full text-sm hover:bg-[#00C9A7]/10 transition"
                >
                  + {item}
                </button>
              ))}
          </div>
        </div>

        {/* Travel Style - Floating Select */}
        <div className="relative z-0 pt-2">
          <select
            id="travelStyle"
            name="travelStyle"
            value={formData.travelStyle}
            onChange={handleChange}
            className="block w-full pt-5 pb-1 px-0 mt-0 bg-transparent border-0 border-b border-[#00C9A7] appearance-none focus:outline-none focus:ring-0 focus:border-[#FF7E5F] peer"
            required
          >
            <option value=""></option>
            <option value="Solo">Solo</option>
            <option value="Couple">Couple</option>
            <option value="Family">Family</option>
            <option value="Backpacking">Backpacking</option>
          </select>
          <label
            htmlFor="travelStyle"
            className="absolute text-sm text-[#2C3E50] duration-300 transform -translate-y-6 scale-75 top-4 z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Travel Style
          </label>
          <div className="absolute right-0 bottom-3 pointer-events-none">
            <svg className="w-5 h-5 text-[#00C9A7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {errors.travelStyle && (
            <p className="absolute text-xs text-red-400 mt-1">{errors.travelStyle}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-gradient-to-r from-[#FF7E5F] to-[#FF9A5F] text-white py-4 rounded-md transition-all duration-300 mt-8 group ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }`}
        >
          {isLoading ? (
            <div className="flex justify-center items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Planning...
            </div>
          ) : (
            <span className="block group-hover:translate-x-1 transition-transform">
              Generate Itinerary →
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

export default Dashboard;
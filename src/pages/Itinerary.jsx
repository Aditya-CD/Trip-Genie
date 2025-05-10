import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { storeInVectorDB } from "../lib/vectorStorage";
import { useReactToPrint } from 'react-to-print';
import LocationCard from '../lib/LocationCard';



function Itinerary() {
  const { state } = useLocation();
  const { formData } = state || {};
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const promptRef = useRef(null);
  const navigate = useNavigate();
  const userAddress = localStorage.getItem("walletAddress");
  const [weatherData, setWeatherData] = useState(null);
  const [showWeatherPopup, setShowWeatherPopup] = useState(false);


  const MISTRAL_API_KEY = "HXDPWiWpbXsWDslsYmjtVSPe4EpRSJMy";
  const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

  const fetchWeather = async () => {
    if (!formData?.destination) {
      setWeatherError("No destination specified");
      return;
    }

    try {
      setWeatherLoading(true);
      setWeatherError("");
      const API_KEY = "1b273b7abfbf65d694246f5954166ca5";
      const city = formData.destination;
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );

      const weatherInfo = {
        condition: response.data.weather[0].main,
        description: response.data.weather[0].description,
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        icon: response.data.weather[0].icon
      };

      setWeatherData(weatherInfo);

      // Update itinerary with weather information
      setItinerary(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          summary: {
            ...prev.summary,
            weather: weatherInfo
          }
        };
      });
    } catch (err) {
      console.error("Failed to fetch weather:", err);
      setWeatherError("Couldn't fetch weather details. Please try again later.");
    } finally {
      setWeatherLoading(false);
    }
    setTimeout(() => {
      setShowWeatherPopup(true);
    }, 2000);
  };


  const buildBasePrompt = () => {
    return `Create a detailed ${formData.travelStyle.toLowerCase()} travel itinerary for ${formData.destination} 
from ${formData.startDate} to ${formData.endDate} with a budget of ${formData.budget} INR.
Focus on: ${formData.interests.join(", ")}.
Return as JSON with this structure:
{
  "days": [
    {
      "day_number": 1,
      "date": "2023-01-01",
      "title": "Arrival in City",
      "locations": [
        {
          "name": "Heydar Aliyev Center",
          "time": "10:00 AM - 12:00 PM",
          "description": "Modern architectural marvel",
          "category": "Culture",
          "cost": "500-700 INR",
          "image_query": "Heydar Aliyev Center architecture"
        }
      ]
    }
  ],
  "summary": {
    "total_estimated_cost": "42,000-50,000 INR",
    "cultural_notes": ["Conservative attire suggested at religious sites"]
  }
}`;
  };

  const generateItinerary = async (prompt, isModification = false) => {
    try {
      setLoading(true);
      setError("");

      const messages = [
        ...conversationHistory,
        { role: "user", content: prompt }
      ];

      const response = await axios.post(
        MISTRAL_API_URL,
        {
          model: "mistral-small",
          messages: messages,
          temperature: 0.7,
          response_format: { type: "json_object" },
          max_tokens: 2000
        },
        {
          headers: {
            "Authorization": `Bearer ${MISTRAL_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      const result = response.data.choices[0]?.message?.content;
      if (!result) throw new Error("No itinerary generated");

      // Improved JSON parsing with fallback
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
        // Validate the structure
        if (!parsedResult.days || !Array.isArray(parsedResult.days)) {
          throw new Error("Invalid itinerary structure");
        }
      } catch (e) {
        // If JSON parsing fails, return as plain text
        console.warn("API didn't return valid JSON, using fallback:", e);
        setItinerary({
          days: [{
            day_number: 1,
            title: "Your Itinerary",
            locations: [{
              name: "Full Itinerary",
              description: result,
              time: "All day",
              category: "General"
            }]
          }]
        });
        return;
      }

      setItinerary(parsedResult);
      setConversationHistory([
        ...messages,
        { role: "assistant", content: result }
      ]);

      if (isModification) {
        setModificationPrompt("");
      }
    } catch (error) {
      console.error("API Error:", error);
      setError(error.response?.data?.error?.message ||
        error.message ||
        "Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData?.destination && !itinerary) {
      const initialPrompt = buildBasePrompt();
      generateItinerary(initialPrompt);
    }
  }, [formData]);

  const handleModification = () => {
    if (!modificationPrompt.trim()) return;
    generateItinerary(
      `Modify the current itinerary based on these instructions: ${modificationPrompt}`,
      true
    );
  };

  const itineraryRef = useRef();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleModification();
    }
  };

  const handleConfirmItinerary = () => {
    storeInVectorDB(itinerary)
      .then((result) => {
        if (result) {
          navigate("/planner", {
            state: {
              itinerary,
              formData,
              weatherData,
            },
          });
        } else {
          alert("❌ Failed to store itinerary. Please try again.");
        }
      })
      .catch((error) => {
        console.error("Error storing itinerary:", error);
        alert("❌ An error occurred. Please try again.");
      });
  };

  const handlePrint = useReactToPrint({
    content: () => itineraryRef.current,
    pageStyle: `
            @page { size: auto; margin: 10mm; }
            body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: white !important;
                color: black !important;
            }
            .print-content {
                padding: 20px;
            }
            .location-card {
                page-break-inside: avoid;
                margin-bottom: 15px;
            }
        `,
    documentTitle: `${formData.destination || 'My'}_Trip_Itinerary`,
  });



  return (
    <div className="w-screen min-h-screen bg-[#FEF9F5] flex flex-col items-center px-4 py-8 overflow-x-hidden relative">
      {/* Background elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF7E5F]/10 rounded-full mix-blend-multiply blur-xl animate-[blob_7s_infinite]"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#00C9A7]/10 rounded-full mix-blend-multiply blur-xl animate-[blob_7s_infinite_2s]"></div>

      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-sm rounded-xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] p-8 relative z-10">
        <h1 className="text-4xl font-thin text-center text-[#2C3E50] mb-2">
          Trip Genie 🌴
        </h1>
        <h2 className="text-2xl font-thin text-center text-[#FF7E5F] mb-8">
          Your Personalized Itinerary
        </h2>

        {/* Trip Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-6 bg-white rounded-lg border border-[#00C9A7]/20 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-light text-[#2C3E50]/70">Destination</p>
            <p className="text-lg font-medium text-[#2C3E50]">{formData?.destination || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-light text-[#2C3E50]/70">Travel Dates</p>
            <p className="text-lg font-medium text-[#2C3E50]">
              {formData?.startDate || "N/A"} → {formData?.endDate || "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-light text-[#2C3E50]/70">Budget</p>
            <p className="text-lg font-medium text-[#2C3E50]">
              {formData?.budget ? `₹${parseInt(formData.budget).toLocaleString('en-IN')}` : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-light text-[#2C3E50]/70">Travel Style</p>
            <p className="text-lg font-medium text-[#2C3E50]">{formData?.travelStyle || "N/A"}</p>
          </div>
          <div className="md:col-span-2 space-y-1">
            <p className="text-sm font-light text-[#2C3E50]/70">Interests</p>
            <div className="flex flex-wrap gap-2">
              {formData?.interests?.map(interest => (
                <span key={interest} className="px-3 py-1 bg-[#00C9A7]/10 text-[#00C9A7] rounded-full text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>



        {/* Itinerary Content */}
        <div ref={itineraryRef} className="bg-white rounded-lg p-6 min-h-[300px] mb-6 max-h-[60vh] overflow-y-auto border border-[#00C9A7]/20 shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7E5F]"></div>
              <p className="text-[#2C3E50] font-light">
                {modificationPrompt ? "Crafting your updates..." : "Generating your perfect itinerary..."}
              </p>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[#2C3E50] mb-1">Something went wrong</h3>
              <p className="text-[#2C3E50]/70">{error}</p>
              <button
                onClick={() => generateItinerary(buildBasePrompt())}
                className="mt-4 px-4 py-2 bg-[#FF7E5F] text-white rounded-md hover:bg-[#FF7E5F]/90 transition"
              >
                Try Again
              </button>
            </div>
          ) : itinerary && itinerary.days ? (
            <div className="space-y-8">
              {itinerary.days.map(day => (
                <div key={day.day_number} className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
                    Day {day.day_number}: {day.title}
                  </h2>
                  <p className="text-gray-500 mb-4">{day.date}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {day.locations.map((location, index) => (
                      <LocationCard key={index} location={location} />
                    ))}
                  </div>
                </div>
              ))}

              {itinerary.summary && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Trip Summary</h3>
                  <p className="font-medium mb-2">Estimated Cost: {itinerary.summary.total_estimated_cost}</p>
                  {itinerary.summary.cultural_notes && (
                    <div>
                      <h4 className="font-medium mb-2">Cultural Notes:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {itinerary.summary.cultural_notes.map((note, i) => (
                          <li key={i} className="text-gray-600">{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-[#2C3E50]/70">
              No itinerary generated yet
            </div>
          )}
        </div>

        {/* Modification Panel */}
        {itinerary && (
          <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm pt-6 pb-4 -mx-8 px-8 border-t border-[#00C9A7]/20">
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  ref={promptRef}
                  value={modificationPrompt}
                  onChange={(e) => setModificationPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="How would you like to modify this itinerary? (e.g., 'Add more budget options', 'Remove museum visits', 'Make day 2 more relaxed')"
                  className="w-full p-4 pr-12 rounded-lg bg-[#FEF9F5] border border-[#00C9A7]/30 text-[#2C3E50] outline-none resize-none focus:border-[#FF7E5F] focus:ring-1 focus:ring-[#FF7E5F]/30 transition"
                  rows={3}
                  disabled={loading}
                />
                <button
                  onClick={handleModification}
                  disabled={loading || !modificationPrompt.trim()}
                  className="absolute right-3 bottom-3 p-2 bg-[#FF7E5F] text-white rounded-md hover:bg-[#FF7E5F]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap justify-between gap-3">
                <button
                  onClick={() => generateItinerary(buildBasePrompt())}
                  className="px-5 py-2.5 bg-[#2C3E50]/5 text-[#2C3E50] rounded-lg hover:bg-[#2C3E50]/10 transition flex items-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={fetchWeather}
                    disabled={weatherLoading || !formData?.destination}
                    className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center gap-2 ${weatherLoading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                  >
                    {weatherLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Get Weather
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleConfirmItinerary}
                    className="px-5 py-2.5 bg-[#FF7E5F] text-white rounded-lg hover:bg-[#FF7E5F]/90 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {weatherError && (
          <div className="mt-2 text-red-500 text-sm">{weatherError}</div>
        )}

        {weatherData && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Current Weather in {formData.destination}</h3>
            <div className="flex items-center">
              {weatherData.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                  alt={weatherData.condition}
                  className="w-16 h-16"
                />
              )}
              <div className="ml-3">
                <p className="text-2xl font-bold">{weatherData.temperature}°C</p>
                <p className="capitalize">{weatherData.description}</p>
                <p className="text-sm">Humidity: {weatherData.humidity}%</p>
                <p className="text-sm">Wind: {weatherData.windSpeed} m/s</p>
              </div>
            </div>
          </div>
        )}


        {showWeatherPopup && (
          <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-lg shadow-lg z-50">
            ✅ It’s perfect for the trip. No need for changing plans!
          </div>
        )}

        {!itinerary && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-[#2C3E50]/5 text-[#2C3E50] rounded-lg hover:bg-[#2C3E50]/10 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Planner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Itinerary;
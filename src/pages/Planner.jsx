import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getItinerary } from "../lib/vectorStorage";
import ReactMarkdown from "react-markdown";
import DirectionMap from "../components/DirectionMap";
import { useJsApiLoader } from "@react-google-maps/api";
import FlightOptions from '../components/FlightOptions';
import axios from "axios";
import { useNavigate } from "react-router-dom";



const libraries = ['places'];

function Planner() {
  const { state } = useLocation();
  const { itinerary, formData } = state || {};
  const [storedItinerary, setStoredItinerary] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [originIata, setOriginIata] = useState(null);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);







  const [hotels, setHotelData] = useState([]);

  const fetchHotels = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/hotels', {
        params: { city: formData?.destination },
      });
      setHotelData(response.data.results.slice(0, 10)); // Top 10 only
      setShowHotelModal(true); // Show modal
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
    }
  };


  const navigate = useNavigate();

  const handleConfirm = () => {
    const payload = {
      itinerary,
      selectedFlight,
      selectedHotel,
      formData,
    };

    localStorage.setItem("confirmedBooking", JSON.stringify(payload));
    navigate("/invoice");
  };




  const handleViewItinerary = async () => {
    const stored = await getItinerary();
    if (stored.length > 0) {
      setStoredItinerary(stored[stored.length - 1]);
      setShowModal(true);
    } else {
      alert("No stored itinerary found.");
    }
  };


  const [places, setPlaces] = useState([]);



  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCrlHym54K8K8uHiXZ-W4VcP-_qswr1aGg",
    libraries,
  });

  const [selectedFlight, setSelectedFlight] = useState(null);




  useEffect(() => {
    if (typeof itinerary === "string") {
      const placeRegex = /\*\d{1,2}:\d{2} (AM|PM)\*:.*?at\s([A-Z][a-zA-Z\s]+)/g;
      const matches = itinerary.matchAll(placeRegex);
      const extracted = Array.from(matches, m => m[2]);
      setPlaces([...new Set(extracted)]);
    }
  }, [itinerary]);

  ;


  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-[#fff4e6] to-[#f0f9ff] text-[#2c3e50] p-6">
      <h1 className="text-5xl font-thin  text-[black] mb-10 ">Trip Genie 🌴</h1>

      {/* Trip Summary Card */}
      <div className="relative bg-white rounded-3xl p-8 mb-10 shadow-xl border border-[#e0e0e0]">
        <h2 className="text-2xl font-semibold text-[#4ecdc4] mb-4">📋 Trip Summary</h2>
        <p><strong>📍 Destination:</strong> {formData?.destination}</p>
        <p><strong>📅 Dates:</strong> {formData?.startDate} → {formData?.endDate}</p>
        <p><strong>💰 Budget:</strong> ₹{formData?.budget}</p>
        <p><strong>🧳 Travel Style:</strong> {formData?.travelStyle}</p>
        <p><strong>🎯 Interests:</strong> {formData?.interests?.join(", ")}</p>

        <button
          onClick={handleViewItinerary}
          className="absolute top-6 right-6 px-5 py-2 bg-gradient-to-r from-[#4ecdc4] to-[#556270] text-white rounded-full shadow hover:scale-105 transition-transform"
        >
          View Itinerary
        </button>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-[#dce0e0]">
        <h2 className="text-xl font-semibold text-[#ff7e5f] mb-2">🗺️ Map Directions</h2>
        <p className="text-[#555] mb-2">We'll guide you to these amazing places:</p>
        <ul className="list-disc ml-6 text-[#333]">
          {places.map((place, idx) => (
            <li key={idx}>{place}</li>
          ))}
        </ul>
        {storedItinerary && isLoaded && (
          <div className="mt-4 w-full h-96 rounded-xl overflow-hidden">
            <DirectionMap itinerary={JSON.parse(storedItinerary)} destination={formData.destination} />
          </div>
        )}

      </div>

      {/* Flights Section */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-[#dce0e0]">
        <h2 className="text-xl font-semibold text-[#ff7e5f] mb-2">✈️ Flight Options</h2>
        <p className="text-[#555] mb-2">Check out top flight options for your trip to <strong>{formData?.destination}</strong>.</p>
        {originIata && destinationIata ? (
          <FlightOptions
            origin="DEL"
            destination="GYD" // Replace this with the correct IATA code from formData if dynamic
            date={formData?.startDate}
          />
        ) : (
          <p className="text-red-500">Looking for flights...</p>
        )}
        {selectedFlight && (
          <div className="mt-4 p-4 border rounded-xl bg-green-50 text-green-700">
            <p><strong>✅ Selected Flight:</strong> {selectedFlight.airline}, {selectedFlight.time}, {selectedFlight.price}</p>
            <button
              onClick={() => alert(`Flight confirmed: ${selectedFlight.airline} at ${selectedFlight.time}`)}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Confirm This Flight
            </button>
          </div>
        )}

      </div>

      {/* Hotel Section */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-[#dce0e0]">
        <h2 className="text-xl font-semibold text-[#ff7e5f] mb-2">🏨 Hotel Recommendations</h2>
        <p className="text-[#555] mb-2">These stays are picked for your comfort and convenience near the itinerary locations.</p>
        <button
          onClick={fetchHotels}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
        >
          Fetch Hotels
        </button>
      </div>




      {/* Booking Button */}
      <div className="text-center">
        <button
          className="px-8 py-4 bg-gradient-to-r from-[#ff6b6b] to-[#f8e9a1] text-grey font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
          onClick={handleConfirm}
        >
          Confirm Bookings
        </button>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-[#2c3e50] rounded-2xl p-6 w-[90%] max-w-3xl h-[80%] overflow-y-auto relative shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-[#4ecdc4]">📜 Stored Itinerary</h2>
            <div className="prose max-w-none">
              <div className="prose max-w-none">
                {(() => {
                  try {
                    const parsed = JSON.parse(storedItinerary);
                    return parsed.days?.map((day, idx) => (
                      <div key={idx} className="mb-6">
                        <h3 className="text-xl font-semibold">Day {day.day_number}: {day.title}</h3>
                        <p className="text-gray-700 mb-2">📅 {day.date}</p>
                        {day.locations?.length > 0 && (
                          <>
                            <h4 className="font-bold">🗺 Locations:</h4>
                            <ul className="list-disc ml-5 mb-2">
                              {day.locations.map((loc, i) => (
                                <li key={i}>
                                  <strong>{loc.name}</strong> ({loc.time}): {loc.description} — {loc.cost}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {day.food_recommendations && (
                          <>
                            <h4 className="font-bold">🍽 Food:</h4>
                            <ul className="list-disc ml-5 mb-2">
                              {day.food_recommendations.map((food, i) => (
                                <li key={i}>
                                  <strong>{food.name}</strong>: {food.description} — {food.cost}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {day.nightlife_recommendations && (
                          <>
                            <h4 className="font-bold">🌃 Nightlife:</h4>
                            <ul className="list-disc ml-5">
                              {day.nightlife_recommendations.map((spot, i) => (
                                <li key={i}>
                                  <strong>{spot.name}</strong>: {spot.description} — {spot.cost}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    ));
                  } catch (err) {
                    return <p className="text-red-500">Failed to parse itinerary.</p>;
                  }
                })()}
              </div>

            </div>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      {showHotelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[90%] max-w-3xl max-h-[80%] overflow-y-auto shadow-xl relative">
            <h2 className="text-2xl font-bold mb-4 text-[#ff7e5f]">🏨 Choose Your Hotel</h2>
            <ul className="space-y-4">
              {hotels.map(hotel => (
                <li
                  key={hotel.place_id}
                  className={`p-4 border rounded cursor-pointer ${selectedHotel?.place_id === hotel.place_id ? 'bg-green-100 border-green-500' : 'bg-white'}`}
                  onClick={() => setSelectedHotel(hotel)}
                >
                  <h4 className="text-lg font-semibold">{hotel.name}</h4>
                  <p>{hotel.formatted_address}</p>
                  <p>Rating: {hotel.rating || "N/A"}</p>
                  {hotel.photos?.[0] && (
                    <img
                      src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${hotel.photos[0].photo_reference}&key=AIzaSyCrlHym54K8K8uHiXZ-W4VcP-_qswr1aGg`}
                      alt={hotel.name}
                      className="mt-2 rounded"
                    />
                  )}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowHotelModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold"
            >
              ✖
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Planner;

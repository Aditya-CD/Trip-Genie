import { useEffect, useState } from "react";
import { fetchFlights } from "../lib/fetchFlights";

function FlightOptions({ origin, destination, date, onFlightSelect }) {
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);

  useEffect(() => {
    if (origin && destination && date) {
      fetchFlights(origin, destination, date).then(setFlights);
    }
  }, [origin, destination, date]);

  return (
    <div className="space-y-4">
      {flights.length === 0 && (
        <p className="text-gray-500">No flights found for {date}.</p>
      )}
      {flights.map((flight, idx) => (
        <div
          key={idx}
          className={`border p-4 rounded-xl shadow ${
            selectedFlight?.flight?.number === flight.flight?.number
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300"
          } cursor-pointer`}
          onClick={() => setSelectedFlight(flight)}
        >
          <p className="font-bold text-lg">{flight.airline.name}</p>
          <p>Flight Number: {flight.flight.number}</p>
          <p>From: {flight.departure.iata} → To: {flight.arrival.iata}</p>
          <p>Departure: {flight.departure.scheduled}</p>
        </div>
      ))}

      {selectedFlight && (
        <button
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          onClick={() => onFlightSelect(selectedFlight)}
        >
          Confirm Flight
        </button>
      )}
    </div>
  );
}

export default FlightOptions;

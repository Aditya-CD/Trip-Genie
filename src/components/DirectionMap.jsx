import {
    GoogleMap,
    DirectionsRenderer,
    Marker,
    useJsApiLoader,
  } from "@react-google-maps/api";
  import { useEffect, useState } from "react";
  
  const libraries = ["places"];
  
  const containerStyle = {
    width: "100%",
    height: "100%",
  };
  
  const defaultCenter = {
    lat: 28.6139, // Default center: Delhi
    lng: 77.2090,
  };
  
  function DirectionMap({ itinerary, destination = "India" }) {
    const [directions, setDirections] = useState(null);
    const [locations, setLocations] = useState([]);
    const [center, setCenter] = useState(defaultCenter);
  
    const { isLoaded } = useJsApiLoader({
      googleMapsApiKey: "AIzaSyCrlHym54K8K8uHiXZ-W4VcP-_qswr1aGg",
      libraries: libraries,
    });
  
    useEffect(() => {
      if (!itinerary || !itinerary.days) return;
  
      const allLocations = itinerary.days
        .flatMap((day) =>
          day.locations?.map((loc) => `${loc.name}, ${destination}`)
        )
        .filter(Boolean);
  
      console.log("📍 Raw Locations:", allLocations);
  
      setLocations(allLocations);
  
      if (allLocations.length < 2 || !isLoaded) {
        console.warn("Not enough valid locations or map not loaded.");
        return;
      }
  
      const directionsService = new window.google.maps.DirectionsService();
  
      directionsService.route(
        {
          origin: allLocations[0],
          destination: allLocations[allLocations.length - 1],
          waypoints: allLocations.slice(1, -1).map((loc) => ({
            location: loc,
            stopover: true,
          })),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error("❌ Directions request failed:", status, result);
            alert(
              "Some locations couldn't be mapped. Try refining the itinerary location names."
            );
          }
        }
      );
  
      // Set center to first location if possible
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: allLocations[0] }, (results, status) => {
        if (status === "OK" && results[0]) {
          setCenter(results[0].geometry.location);
        }
      });
    }, [itinerary, isLoaded, destination]);
  
    if (!isLoaded) return <p>Loading map...</p>;
  
    return (
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
        {/* Route line */}
        {directions && <DirectionsRenderer directions={directions} />}
  
        {/* Markers with labels */}
        {locations.map((loc, idx) => (
          <Marker
            key={idx}
            position={{ lat: 0, lng: 0 }} // Temporary
            label={`${idx + 1}`}
            title={loc}
            onLoad={(marker) => {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ address: loc }, (results, status) => {
                if (status === "OK" && results[0]) {
                  marker.setPosition(results[0].geometry.location);
                } else {
                  console.warn(`Could not geocode marker for: ${loc}`);
                }
              });
            }}
          />
        ))}
      </GoogleMap>
    );
  }
  
  export default DirectionMap;
  
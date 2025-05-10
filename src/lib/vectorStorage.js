
export async function storeInVectorDB(itineraryText) {
  try {
    const response = await fetch("http://127.0.0.1:8000/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: JSON.stringify(itineraryText) }),
    });

    if (!response.ok) throw new Error("Failed to store itinerary in vector DB");

    const data = await response.json();
    console.log("Itinerary stored successfully:", data);
    return data;
  } catch (error) {
    console.error("Vector DB Error:", error);
    return null;
  }
}

export async function getItinerary() {
  try {
    const response = await fetch("http://127.0.0.1:8000/get-itinerary");
    if (!response.ok) throw new Error("Failed to fetch stored itinerary");

    const data = await response.json();
    return data.itineraries || [];
  } catch (error) {
    console.error("Fetch Itinerary Error:", error);
    return [];
  }
}



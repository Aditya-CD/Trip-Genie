export const fetchFlights = async (origin, destination, date) => {
  try {
    const response = await fetch(
      `hhttps://sky-scrapper.p.rapidapi.com/api/v1/flights/getFlightDetails?legs=%5B%7B%22destination%22%3A%22LOND%22%2C%22origin%22%3A%22LAXA%22%2C%22date%22%3A%222024-04-11%22%7D%5D&adults=1&currency=USD&locale=en-US&market=en-US&cabinClass=economy&countryCode=US/flights?dep_iata=${origin}&arr_iata=${destination}&flight_date=${date}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "sky-scrapper.p.rapidapi.com",
          "x-rapidapi-key": "87d89229b3mshc5db6b5768952d1p16e7a3jsndc413c0506cf"
        }
      }
    );

    const data = await response.json();
    return data?.data || [];
  } catch (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
};

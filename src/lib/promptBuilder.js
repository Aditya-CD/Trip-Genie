// utils/promptBuilder.js

export const buildBasePrompt = (formData, weatherData) => {
  let prompt = `Create a detailed ${formData.travelStyle.toLowerCase()} travel itinerary for ${formData.destination} 
from ${formData.startDate} to ${formData.endDate} with a budget of ${formData.budget} INR.
Focus on: ${formData.interests.join(", ")}.`;

  // Weather-aware logic
  if (weatherData?.some(day => day?.description?.toLowerCase().includes("overcast"))) {
    prompt += ` The weather forecast includes overcast days, so prefer indoor activities like museums, local cafes, and indoor markets.`;
  }

  prompt += `
Return as JSON with this structure:
{
  "days": [...],
  "summary": {...}
}`;
  return prompt;
};

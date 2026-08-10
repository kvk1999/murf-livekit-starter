# Day 5 – Connect Your Agent to Real Data (Tools & External APIs)

Welcome to **Day 5** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. The goal of Day 5 is to empower your agent to retrieve real-time external data using production-grade lookup tools, robust error handling, and observation timestamping.

---

## 🎯 Day 5 Objectives

* **Mandatory Tool Selection**: Pick the single essential lookup tool your agent can't perform its real-world job without (`get_current_weather`).
* **Real External Data Integration**: Fetch live weather and geocoding metrics directly from the public **Open-Meteo REST API** (no mocked datasets).
* **Precise Tool Description**: Carefully craft docstrings and function schemas so the LLM invokes the tool accurately without false positives or missed triggers.
* **Out-Loud Failure Handling**: Handle network timeouts and bad inputs out loud so the agent speaks a helpful message instead of hallucinating or staying silent.
* **Data Recency & Timestamping**: Include clear UTC timestamps in observations so users know exactly when the retrieved data was observed.
* **Verification & Testing**: Verify tool execution end-to-end via automated unit tests and live agent interaction.

---

## 🛠️ Architecture & Data Flow

```
[🎙️ User: "What's the weather in Chennai?"]
       │
       ▼
[Google Gemini LLM] ──(Detects need for weather)──► [Function Tool: get_current_weather]
                                                            │
                                                            ▼
                                                [Open-Meteo Geocoding API]
                                                            │
                                                            ▼
                                                [Open-Meteo Forecast API]
                                                            │
       ┌────────────────────────────────────────────────────┘
       ▼
[Returns Spoken Text with Timestamp] ──► [Murf Falcon TTS] ──► [🔊 "Live weather update as of..."]
```

---

## 💻 Key Implementation (`backend/src/agent.py` & `backend/tests/test_db.py`)

### 1. Function Tool Definition (`get_current_weather`)

```python
@function_tool
async def get_current_weather(self, context: RunContext, city: str):
    """Fetch live real-time weather data for a specific city to help street vendors and local commerce sellers plan outdoor markets and delivery logistics.

    Use this tool ONLY when the user asks about live weather, current temperature, rain conditions, or weather-dependent outdoor market conditions for a specified location/city.

    Args:
        city: The name of the city or location (e.g., 'Chennai', 'Mumbai', 'Delhi', 'Bengaluru').
    """
    import json
    import urllib.parse
    import urllib.request
    from datetime import datetime

    logger.info(f"Executing live weather lookup for city: {city}")
    try:
        # Step 1: Geocoding via Open-Meteo Geocoding API
        encoded_city = urllib.parse.quote(city)
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_city}&count=1&language=en&format=json"
        
        req = urllib.request.Request(
            geo_url,
            headers={"User-Agent": "VoiceAgentLocalCommerce/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            geo_data = json.loads(resp.read().decode("utf-8"))

        if not geo_data.get("results"):
            return f"I could not locate '{city}'. Please check the city name and try again."

        loc = geo_data["results"][0]
        lat, lon = loc["latitude"], loc["longitude"]
        location_name = f"{loc.get('name', city)}, {loc.get('country', '')}"

        # Step 2: Fetch current weather metrics from Open-Meteo API
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        req_w = urllib.request.Request(
            weather_url,
            headers={"User-Agent": "VoiceAgentLocalCommerce/1.0"}
        )
        with urllib.request.urlopen(req_w, timeout=5) as resp_w:
            weather_data = json.loads(resp_w.read().decode("utf-8"))

        curr = weather_data.get("current_weather")
        if not curr:
            return f"Weather data is currently unavailable for {location_name}."

        temp = curr.get("temperature")
        windspeed = curr.get("windspeed")
        weathercode = curr.get("weathercode")
        obs_time = curr.get("time", datetime.now().strftime("%Y-%m-%d %H:%M"))

        weather_descriptions = {
            0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
            45: "foggy", 51: "light drizzle", 61: "slight rain", 63: "moderate rain",
            65: "heavy rain", 95: "thunderstorm"
        }
        condition = weather_descriptions.get(weathercode, "current conditions")

        return (
            f"Live weather update for {location_name} as of {obs_time} (UTC): "
            f"Temperature is {temp}°C with {condition} and wind speed of {windspeed} km/h."
        )

    except urllib.error.URLError as e:
        logger.error(f"Network timeout or failure while fetching weather for {city}: {e}")
        return (
            f"I am sorry, but I am currently unable to fetch live weather data for {city} "
            f"due to a network service timeout. Please try again in a few moments."
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_current_weather for {city}: {e}")
        return f"I encountered an unexpected issue while looking up the weather for {city}."
```

---

## 🧪 Automated Testing (`backend/tests/test_db.py`)

Run the test suite:

```bash
cd backend
uv run python tests/test_db.py
```

**Test Output:**
```
ALL SQLITE CALLER MEMORY TESTS PASSED SUCCESSFULLY!

--- Testing Weather Tool (Valid City: Chennai) ---
Result: Live weather update for Chennai, India as of 2026-08-10T12:30 (UTC): Temperature is 31.0°C with partly cloudy and wind speed of 13.1 km/h.

--- Testing Weather Tool (Invalid City: NonExistentCityX123) ---
Result: I could not locate 'NonExistentCityX123'. Please check the city name and try again.
ALL WEATHER TOOL TESTS PASSED SUCCESSFULLY!
```

---

## ✅ Day 5 Verification Checklist

* [x] Picked essential real-time lookup tool (`get_current_weather`).
* [x] Connected to live public Open-Meteo REST API data.
* [x] Formulated detailed tool descriptions and system instructions to guide model invocation.
* [x] Implemented out-loud error messages for timeouts, missing locations, and network failures.
* [x] Included observation timestamps in weather reports.
* [x] Verified tool execution via automated unit tests and agent speech connection.

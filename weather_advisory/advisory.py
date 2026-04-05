def generate_advisory(current, forecast, crop):

    score = {
        "heat": 0,
        "disease": 0,
        "water_stress": 0,
        "wind_risk": 0
    }

    temp = current["main"]["temp"]
    humidity = current["main"]["humidity"]
    wind = current["wind"]["speed"]

    # 🌡 HEAT SCORE
    if temp > 25:
        score["heat"] += (temp - 25)

    # 💧 WATER STRESS
    if humidity < 50:
        score["water_stress"] += (50 - humidity)

    # 🌬 WIND
    if wind > 5:
        score["wind_risk"] += (wind - 5) * 2

    # 🌧 FORECAST ANALYSIS
    rain_expected = False

    for item in forecast["list"][:10]:
        f_temp = item["main"]["temp"]
        f_humidity = item["main"]["humidity"]

        if item.get("rain"):
            rain_expected = True

        if f_temp > 30:
            score["heat"] += 1

        if f_humidity > 80:
            score["disease"] += 2

    # ✅ SAFE crop handling (FIXED BUG)
    crop = (crop or "").lower()

    # 🌾 CROP SENSITIVITY
    if crop == "wheat":
        score["heat"] *= 1.3
        score["disease"] *= 1.2

    elif crop == "rice":
        score["water_stress"] *= 1.5
        score["disease"] *= 1.3

    elif crop == "maize":
        score["heat"] *= 1.2
        score["wind_risk"] *= 1.3

    else:
        # Default if crop not entered
        score["heat"] *= 1.1

    # 🎯 FINAL ADVISORY
    advice = []

    if score["heat"] > 8:
        advice.append("High heat stress. Increase irrigation & use mulching.")

    if score["water_stress"] > 10:
        advice.append("Severe water stress. Immediate irrigation required.")

    if score["disease"] > 6:
        advice.append("High disease risk. Apply preventive fungicide.")

    if score["wind_risk"] > 6:
        advice.append("High wind risk. Avoid pesticide spraying.")

    if rain_expected:
        advice.append("Rain expected soon. Delay irrigation and spraying.")

    # 🌱 fallback
    if not advice:
        advice.append("Conditions are stable. Maintain regular practices.")

    # 💡 Suggest crop input if missing
    if not crop:
        advice.append("Tip: Enter crop name for more accurate advisory.")

    return advice

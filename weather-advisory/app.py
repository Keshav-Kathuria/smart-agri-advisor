from flask import Flask, render_template, request, jsonify
import requests
from advisory import generate_advisory

app = Flask(__name__)

API_KEY = "b9f61841f7ead934a66d2ea6e51a4435"

def get_weather(city):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    return requests.get(url).json()

def get_forecast(city):
    url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
    return requests.get(url).json()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/get_advisory", methods=["POST"])
def get_advisory():
    data = request.get_json()

    city = data.get("city")
    crop = data.get("crop")

    current = get_weather(city)
    forecast = get_forecast(city)

    if current.get("cod") != 200:
        return jsonify({"error": "City not found"}), 400

    advice = generate_advisory(current, forecast, crop)

    return jsonify({
        "temperature": current["main"]["temp"],
        "humidity": current["main"]["humidity"],
        "wind": current["wind"]["speed"],
        "advice": advice
    })

if __name__ == "__main__":
    app.run(debug=True)

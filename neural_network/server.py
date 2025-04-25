import numpy as np

from flask import Flask, request, jsonify
from flask_cors import CORS

from model import DigitsRecognizer

app = Flask(__name__)
CORS(app, origins="*")

digits_recognizer = DigitsRecognizer(
    network_structure=(784, 256, 128, 10),
    initialize_from_existing_parameters=True
)

training_labels, training_data = digits_recognizer.load_data()


@app.route('/save_model', methods=['GET'])
def save_model():
    digits_recognizer.save_model()
    return "Success"


@app.route('/recognize_digit', methods=['GET', 'POST'])
def recognize_digit():
    data = request.get_json().get("image")
    digit = request.get_json().get("digit")
    image = np.array(data) / 255
    if digit:
        predictions = digits_recognizer.retrain(image, digit)
        digits_recognizer.retrain(training_data, training_labels)
        print(digits_recognizer.predict(image, with_percentage=True))
    else:
        predictions = digits_recognizer.predict(image, with_percentage=True)

    print(predictions)
    prediction_int = int(np.argmax(predictions, axis=0)[0])
    percentages = np.round((predictions*100), 0).flatten().tolist()
    return jsonify({"digit": prediction_int, "percentages": percentages})


app.run(host='127.0.0.1', port=5000)

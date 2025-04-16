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
        prediction_int = digits_recognizer.retrain(image, digit)[0]
        digits_recognizer.retrain(training_data, training_labels)
        print(digits_recognizer.predict(image, with_percentage=True))
    else:
        prediction_int = digits_recognizer.predict(image)[0]
    print(prediction_int)
    return jsonify({"digit": int(prediction_int)})


app.run(host='127.0.0.1', port=5000)

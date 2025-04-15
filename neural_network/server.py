import numpy as np

from flask import Flask, request, jsonify
from flask_cors import CORS

from model import DigitsRecognizer

app = Flask(__name__)
CORS(app, origins="*")

digits_recognizer = DigitsRecognizer(
    network_structure=(784, 256, 128, 64, 10),
    learning_rate=0.001,
    dropout_rate=0.2,
    l2_regularization_rate=0.01,
    batch_size=64,
    initialize_from_existing_parameters=True
)


@app.route('/recognize_digit', methods=['GET', 'POST'])
def recognize_digit():
    data = request.get_json().get("image")
    image = np.array(data) / 255
    prediction_int = digits_recognizer.predict(image)[0]
    print(prediction_int)
    return jsonify({"digit": int(prediction_int)})


app.run(host='127.0.0.1', port=5000)

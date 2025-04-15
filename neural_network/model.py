import numpy as np
import pandas as pd

PATH_TO_DATA = "training_data/"
DATASET_NAMES = ["standard.csv", "extended.csv"]

PATH_TO_WEIGHTS = "weights/model_weights.npy"
PATH_TO_BIASES = "weights/model_biases.npy"


class ActivationFunctions:

    @staticmethod
    def LeakyReLU(values: np.ndarray, alpha: float = 0.1) -> np.ndarray:
        return np.maximum(values, alpha * values)

    @staticmethod
    def LeakyReLU_derivative(values: np.ndarray, alpha: float = 0.1) -> np.ndarray:
        return np.where(values > 0, 1.0, alpha)

    @staticmethod
    def softmax(values: np.ndarray) -> np.ndarray:
        exp_values = np.exp(values - np.max(values, axis=0, keepdims=True))
        return exp_values / np.sum(exp_values, axis=0, keepdims=True)


class DigitsRecognizer:

    def __init__(
            self,
            network_structure: tuple = (784, 256, 128, 64, 10),
            learning_rate: float = 0.01,
            dropout_rate: float = 0.2,
            l2_regularization_rate: float = 0.01,
            batch_size: int = 64,
            initialize_from_existing_parameters: bool = False
    ) -> None:
        self.network_structure = network_structure
        self.learning_rate = learning_rate
        self.dropout_rate = dropout_rate
        self.l2_regularization_rate = l2_regularization_rate
        self.batch_size = batch_size

        self.layers_amount = len(network_structure) - 1

        if initialize_from_existing_parameters:
            self.weights, self.biases = self._load_parameters()
            return

        self.labels, self.data = self._load_data()
        self.samples_amount = self.data.shape[1]

        self.weights, self.biases = self._init_weights_and_biases()

    @staticmethod
    def _load_parameters() -> tuple[list[np.ndarray], list[np.ndarray]]:
        weights = np.load(PATH_TO_WEIGHTS, allow_pickle=True)
        biases = np.load(PATH_TO_BIASES, allow_pickle=True)
        return weights, biases

    @staticmethod
    def _load_data() -> tuple[np.ndarray, np.ndarray]:
        datasets = []
        for i in DATASET_NAMES:
            datasets.append(pd.read_csv(PATH_TO_DATA + i).to_numpy())

        data = np.concatenate(datasets, axis=0)
        np.random.shuffle(data)
        data = data.T

        labels = data[0].astype(int)
        features = data[1:] / 255.0
        return labels, features

    @staticmethod
    def one_hot_Y(labels: np.ndarray, num_classes: int) -> np.ndarray:
        return np.eye(num_classes)[labels].T

    @staticmethod
    def _calculate_accuracy(results: np.ndarray, labels: np.ndarray) -> np.ndarray:
        predictions = np.argmax(results, axis=0)
        return np.mean(predictions == labels)

    def apply_dropout(self, layer: np.ndarray) -> np.ndarray:
        mask = np.random.rand(*layer.shape) > self.dropout_rate
        return layer * mask / (1 - self.dropout_rate)

    def _init_weights_and_biases(self) -> tuple[list[np.ndarray], list[np.ndarray]]:
        weights = []
        biases = []
        for i in range(self.layers_amount):
            input_size = self.network_structure[i]
            output_size = self.network_structure[i + 1]
            weights.append(np.random.randn(output_size, input_size) * np.sqrt(2.0 / input_size))
            biases.append(np.zeros((output_size, 1)))
        return weights, biases

    def forward_propagation(self, x: np.ndarray, training: bool = False) -> tuple[list[np.ndarray], list[np.ndarray]]:
        raw_results = []
        activated_results = [x]

        for i in range(self.layers_amount - 1):
            raw = np.dot(self.weights[i], activated_results[-1]) + self.biases[i]
            activated = ActivationFunctions.LeakyReLU(raw)
            if training:
                activated = self.apply_dropout(activated)
            raw_results.append(raw)
            activated_results.append(activated)

        raw = np.dot(self.weights[-1], activated_results[-1]) + self.biases[-1]
        activated = ActivationFunctions.softmax(raw)
        raw_results.append(raw)
        activated_results.append(activated)

        return raw_results, activated_results

    def backward_propagation(
            self,
            input_data: np.ndarray,
            raw_results: list[np.ndarray],
            activated_results: list[np.ndarray],
            one_hot: np.ndarray
    ) -> tuple[list[np.ndarray], list[np.ndarray]]:
        weights_gradients = [None] * self.layers_amount
        biases_gradients = [None] * self.layers_amount

        error = activated_results[-1] - one_hot
        weights_gradients[-1] = np.dot(error, activated_results[-2].T) / input_data.shape[1] + \
                                self.l2_regularization_rate / input_data.shape[1] * self.weights[-1]
        biases_gradients[-1] = np.sum(error, axis=1, keepdims=True) / input_data.shape[1]

        for i in reversed(range(self.layers_amount - 1)):
            error = np.dot(self.weights[i + 1].T, error) * ActivationFunctions.LeakyReLU_derivative(raw_results[i])
            weights_gradients[i] = np.dot(error, activated_results[i].T) / input_data.shape[1] + \
                                   self.l2_regularization_rate / input_data.shape[1] * self.weights[i]
            biases_gradients[i] = np.sum(error, axis=1, keepdims=True) / input_data.shape[1]

        return weights_gradients, biases_gradients

    def update_parameters(
            self,
            weights_gradients: list[np.ndarray],
            biases_gradients: list[np.ndarray]
    ) -> None:
        for i in range(self.layers_amount):
            self.weights[i] -= self.learning_rate * weights_gradients[i]
            self.biases[i] -= self.learning_rate * biases_gradients[i]

    def train(self, epochs: int = 30) -> None:
        classes_amount = self.network_structure[-1]

        for epoch in range(epochs):
            permutation = np.random.permutation(self.samples_amount)
            shuffled_data = self.data[:, permutation]
            shuffled_labels = self.labels[permutation]

            for batch_start in range(0, self.samples_amount, self.batch_size):
                x_batch = shuffled_data[:, batch_start:batch_start + self.batch_size]
                y_batch = shuffled_labels[batch_start:batch_start + self.batch_size]
                one_hot = self.one_hot_Y(y_batch, classes_amount)

                raw_results, activated_results = self.forward_propagation(x_batch, True)
                weights_gradients, biases_gradients = self.backward_propagation(
                    x_batch, raw_results, activated_results, one_hot)
                self.update_parameters(weights_gradients, biases_gradients)

            predictions = self.forward_propagation(self.data)[1][-1]
            accuracy = self._calculate_accuracy(predictions, self.labels)
            print(f"Epoch {epoch + 1}/{epochs} - Accuracy on training data: {accuracy:.3f} ")

    def predict(self, input_data: np.ndarray, with_percentage: bool) -> np.ndarray:
        if input_data.ndim == 1:
            input_data = input_data.reshape(-1, 1)
        results = self.forward_propagation(input_data)[1][-1]
        if with_percentage:
            return results
        return np.argmax(results[-1], axis=0)

    def save_model(self) -> None:
        np.save(PATH_TO_WEIGHTS, np.array(self.weights, dtype=object), allow_pickle=True)
        np.save(PATH_TO_BIASES, np.array(self.biases, dtype=object), allow_pickle=True)


def main():
    recognizer = DigitsRecognizer(
        network_structure=(784, 256, 128, 64, 10),
        learning_rate=0.001,
        dropout_rate=0.2,
        l2_regularization_rate=0.01,
        batch_size=64,
        initialize_from_existing_parameters=True
    )
    #recognizer.train(epochs=30)
    #recognizer.save_model()

main()

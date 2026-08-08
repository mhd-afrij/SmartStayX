import unittest
from unittest.mock import MagicMock, patch

import app as ml_app


class MlServiceTests(unittest.TestCase):
    def setUp(self):
        self.client = ml_app.app.test_client()

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "ok")
        self.assertIn("model_loaded", payload)

    @patch.object(ml_app, "load_model", return_value=True)
    def test_predict_endpoint(self, _load_model):
        mock_model = MagicMock()
        mock_model.predict.return_value = [12345.67]
        mock_model.estimators_ = [MagicMock(predict=MagicMock(return_value=[12300])), MagicMock(predict=MagicMock(return_value=[12400]))]

        with patch.object(ml_app, "model", mock_model):
            with patch("app.build_feature_vector", return_value=[[1, 2, 3, 4, 5, 6, 7, 8, 9]]):
                response = self.client.post("/predict", json={"basePrice": 1000})

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertAlmostEqual(payload["predictedPrice"], 12345.67, places=2)
        self.assertIn("confidence", payload)


if __name__ == "__main__":
    unittest.main()


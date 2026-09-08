import os
import unittest
from unittest.mock import MagicMock, patch

import app as ml_app
import model_state

TOKEN = "test-token"
AUTH = {"x-internal-token": TOKEN}


def setUpModule():
    os.environ["ML_INTERNAL_TOKEN"] = TOKEN


def tearDownModule():
    os.environ.pop("ML_INTERNAL_TOKEN", None)


class MlServiceAuthTests(unittest.TestCase):
    def setUp(self):
        self.client = ml_app.app.test_client()

    def test_health_is_public(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["service"], "ml-service")

    def test_predict_without_token_is_rejected(self):
        response = self.client.post("/predict", json={"basePrice": 1000})
        self.assertEqual(response.status_code, 401)

    def test_predict_with_wrong_token_is_rejected(self):
        response = self.client.post(
            "/predict", json={"basePrice": 1000}, headers={"x-internal-token": "wrong"}
        )
        self.assertEqual(response.status_code, 401)

    def test_unconfigured_token_returns_503(self):
        with patch.dict(os.environ, {"ML_INTERNAL_TOKEN": ""}):
            response = self.client.post(
                "/predict", json={"basePrice": 1000}, headers=AUTH
            )
        self.assertEqual(response.status_code, 503)
        self.assertIn("ML_INTERNAL_TOKEN", response.get_json()["detail"])


class MlServicePredictTests(unittest.TestCase):
    def setUp(self):
        self.client = ml_app.app.test_client()

    @patch.object(model_state, "load_model", return_value=True)
    def test_predict_endpoint(self, _load_model):
        mock_model = MagicMock()
        mock_model.predict.return_value = [12345.67]
        mock_model.estimators_ = [
            MagicMock(predict=MagicMock(return_value=[12300])),
            MagicMock(predict=MagicMock(return_value=[12400])),
        ]

        with patch.object(model_state, "model", mock_model):
            with patch(
                "routes.pricing.build_feature_vector",
                return_value=[[1, 2, 3, 4, 5, 6, 7, 8]],
            ):
                response = self.client.post(
                    "/predict", json={"basePrice": 1000}, headers=AUTH
                )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertAlmostEqual(payload["predictedPrice"], 12345.67, places=2)
        self.assertIn("modelAgreement", payload)
        self.assertIn("predictionStd", payload)

    def test_predict_contract_with_real_model(self):
        if model_state.model is None:
            self.skipTest("trained model not available")

        response = self.client.post(
            "/predict",
            json={
                "basePrice": 15000,
                "occupancy": 0.78,
                "leadTimeDays": 12,
                "season": "peak",
                "isWeekend": True,
                "amenitiesCount": 6,
                "roomType": "deluxe",
                "isReturningGuest": True,
                "currency": "LKR",
            },
            headers=AUTH,
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("predictedPrice", payload)
        self.assertEqual(payload["currency"], "LKR")
        self.assertIn("modelVersion", payload)
        self.assertIn("predictionStd", payload)
        self.assertIn("modelAgreement", payload)

    def test_predict_rejects_invalid_occupancy(self):
        response = self.client.post(
            "/predict", json={"basePrice": 1000, "occupancy": 1.5}, headers=AUTH
        )
        self.assertEqual(response.status_code, 400)

    def test_predict_rejects_negative_lead_time(self):
        response = self.client.post(
            "/predict", json={"basePrice": 1000, "leadTimeDays": -1}, headers=AUTH
        )
        self.assertEqual(response.status_code, 400)

    def test_predict_rejects_non_positive_base_price(self):
        response = self.client.post("/predict", json={"basePrice": 0}, headers=AUTH)
        self.assertEqual(response.status_code, 400)

    def test_predict_rejects_negative_amenities(self):
        response = self.client.post(
            "/predict", json={"basePrice": 1000, "amenitiesCount": -2}, headers=AUTH
        )
        self.assertEqual(response.status_code, 400)

    def test_predict_rejects_non_numeric_base_price(self):
        response = self.client.post(
            "/predict", json={"basePrice": "abc"}, headers=AUTH
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()

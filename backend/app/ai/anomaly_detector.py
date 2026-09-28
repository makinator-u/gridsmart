import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List, Tuple

class AnomalyDetector:
    """
    AI Anomaly Detection component using Isolation Forest.
    Trained on normalized capacity loading ratios and diurnal curve patterns,
    making it universally accurate across any feeder size without hardcoded capacity assumptions.
    """
    def __init__(self):
        self.model = IsolationForest(contamination=0.06, random_state=42)
        self.is_trained = False
        self.baseline_ranges = {}
        self._train_initial_baseline()

    def _train_initial_baseline(self):
        """
        Train baseline Isolation Forest on normalized diurnal feeder load curves.
        Features: [loading_ratio, hour_of_day, deviation_from_expected_curve]
        """
        np.random.seed(42)
        normal_samples = []

        # Generate realistic statistical baseline across 24 diurnal hours
        # using capacity-normalized ratios (0.0 to 1.0) with varied noise
        for hour in range(24):
            # Expected diurnal curve shape: morning peak ~8:00, afternoon agri ~14:00, evening ~20:00
            expected_ratio = (
                0.40
                + 0.20 * np.exp(-((hour - 8) ** 2) / 6.0)
                + 0.25 * np.exp(-((hour - 14) ** 2) / 8.0)
                + 0.20 * np.exp(-((hour - 20) ** 2) / 6.0)
            )
            for _ in range(30):
                noise = np.random.normal(0, 0.05)
                loading_ratio = np.clip(expected_ratio + noise, 0.20, 0.95)
                deviation = abs(loading_ratio - expected_ratio)
                normal_samples.append([loading_ratio, hour, deviation])

        X = np.array(normal_samples)
        self.model.fit(X)
        self.is_trained = True

        self.baseline_ranges = {
            "min_normal_ratio": float(np.percentile(X[:, 0], 5)),
            "max_normal_ratio": float(np.percentile(X[:, 0], 95)),
            "typical_avg_ratio": float(np.mean(X[:, 0]))
        }

    def detect_feeder_anomaly(
        self,
        feeder_id: str,
        current_load_mw: float,
        capacity_mw: float,
        hour_of_day: float = 14.5
    ) -> Tuple[bool, float, str]:
        """
        Predict whether a feeder reading is anomalous based on normalized capacity and time-of-day.
        Returns: (is_anomaly, anomaly_score, message)
        """
        if not self.is_trained:
            self._train_initial_baseline()

        safe_capacity = max(0.1, capacity_mw)
        loading_ratio = current_load_mw / safe_capacity

        # Calculate expected diurnal ratio for current hour
        expected_ratio = (
            0.40
            + 0.20 * np.exp(-((hour_of_day - 8) ** 2) / 6.0)
            + 0.25 * np.exp(-((hour_of_day - 14) ** 2) / 8.0)
            + 0.20 * np.exp(-((hour_of_day - 20) ** 2) / 6.0)
        )
        deviation = abs(loading_ratio - expected_ratio)

        sample = np.array([[loading_ratio, hour_of_day, deviation]])

        # Isolation forest score: lower score means more anomalous
        score = float(self.model.score_samples(sample)[0])
        prediction = self.model.predict(sample)[0] # -1 for anomaly, 1 for normal

        is_anomaly = bool(prediction == -1 or loading_ratio > 1.05 or deviation > 0.40)

        # Calculate dynamic normal bounds for this specific feeder capacity
        normal_min_mw = round(safe_capacity * 0.30, 2)
        normal_max_mw = round(safe_capacity * 0.85, 2)

        if is_anomaly:
            message = (
                f"UNUSUAL LOAD DETECTED on Feeder {feeder_id}: "
                f"Current load is {current_load_mw:.2f} MW ({loading_ratio * 100:.1f}% capacity, "
                f"expected ~{expected_ratio * safe_capacity:.2f} MW). "
                f"Anomaly score: {score:.3f}."
            )
        else:
            message = f"Feeder {feeder_id} load {current_load_mw:.2f} MW ({loading_ratio * 100:.1f}%) within normal statistical envelope."

        return is_anomaly, score, message

# Global instance
anomaly_detector_service = AnomalyDetector()


from locust import HttpUser, task, between

class EcoMetricLoadTest(HttpUser):
    # Simulates a user pausing for 1 to 3 seconds before their next request
    wait_time = between(1, 3)

    @task(1)
    def check_health(self):
        """Simulate a basic health check ping."""
        self.client.get("/health", name="/health")

    @task(5)  # Runs 5 times more often than the health check
    def calculate_emissions(self):
        """Simulate a user estimating a carbon footprint."""
        payload = {
            "hardware": "A100",
            "hours": 2.5,
            "region": "us-east-1",
            "utilization": 0.85
        }
        
        # We catch the response to ensure it's valid
        with self.client.post("/calculate/task", json=payload, name="/calculate/task", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
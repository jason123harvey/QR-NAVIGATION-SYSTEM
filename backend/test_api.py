# pyrefly: ignore [missing-import]
import pytest
import json
from app import app
from database import init_db, seed_sample_data

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.app_context():
        init_db()
        seed_sample_data(force=True)
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "online"

def test_get_all_locations(client):
    response = client.get("/api/locations")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) > 0

def test_get_locations_filtered_by_floor(client):
    response = client.get("/api/locations?floor=1")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert all(loc["floor"] == 1 for loc in data)

def test_get_single_location_valid(client):
    response = client.get("/api/locations/MAIN_ENTRANCE")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["location_code"] == "MAIN_ENTRANCE"
    assert data["name"] == "Main Entrance"

def test_get_single_location_invalid(client):
    response = client.get("/api/locations/DOES_NOT_EXIST")
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "error" in data

def test_navigation_route_api_valid(client):
    payload = {
        "source": "MAIN_ENTRANCE",
        "destination": "CSE_LAB_1"
    }
    response = client.post("/api/navigation/route", json=payload)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["success"] is True
    assert data["source"] == "MAIN_ENTRANCE"
    assert data["destination"] == "CSE_LAB_1"
    assert "route" in data
    assert "instructions" in data
    assert "distance" in data

def test_navigation_route_api_missing_fields(client):
    response = client.post("/api/navigation/route", json={"source": "MAIN_ENTRANCE"})
    assert response.status_code == 400

def test_qr_generation_api(client):
    response = client.get("/api/qr/MAIN_ENTRANCE")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "qr_image_base64" in data
    assert data["qr_image_base64"].startswith("data:image/png;base64,")
    assert "scan?location=MAIN_ENTRANCE" in data["qr_payload"]

def test_qr_download_api(client):
    response = client.get("/api/qr/MAIN_ENTRANCE/download")
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/png"
    assert len(response.data) > 100

def test_dashboard_stats_api(client):
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["total_locations"] >= 20
    assert data["total_floors"] >= 3
    assert data["total_connections"] > 0

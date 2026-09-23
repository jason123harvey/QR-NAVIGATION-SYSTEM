# pyrefly: ignore [missing-import]
import pytest
import math
from navigation import dijkstra, generate_turn_by_turn_instructions, calculate_estimated_walking_time, get_navigation_route
from database import init_db, seed_sample_data

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()
    seed_sample_data(force=True)

def test_dijkstra_simple_synthetic_graph():
    graph = {
        "A": {"B": {"distance": 5}, "C": {"distance": 10}},
        "B": {"A": {"distance": 5}, "C": {"distance": 2}, "D": {"distance": 8}},
        "C": {"A": {"distance": 10}, "B": {"distance": 2}, "D": {"distance": 1}},
        "D": {"B": {"distance": 8}, "C": {"distance": 1}}
    }
    
    dist, path = dijkstra(graph, "A", "D")
    assert dist == 8  # A -> B (5) -> C (2) -> D (1) = 8
    assert path == ["A", "B", "C", "D"]

def test_dijkstra_same_source_and_destination():
    graph = {
        "ROOM_1": {"ROOM_2": {"distance": 10}},
        "ROOM_2": {"ROOM_1": {"distance": 10}}
    }
    dist, path = dijkstra(graph, "ROOM_1", "ROOM_1")
    assert dist == 0.0
    assert path == ["ROOM_1"]

def test_dijkstra_unreachable_node():
    graph = {
        "A": {"B": {"distance": 5}},
        "B": {"A": {"distance": 5}},
        "ISLAND": {}
    }
    dist, path = dijkstra(graph, "A", "ISLAND")
    assert math.isinf(dist)
    assert path == []

def test_dijkstra_non_existent_node():
    graph = {"A": {"B": 5}, "B": {"A": 5}}
    dist, path = dijkstra(graph, "A", "UNKNOWN")
    assert math.isinf(dist)
    assert path == []

def test_campus_ground_floor_route():
    # Route from Main Entrance to College Canteen on Ground floor
    route_data = get_navigation_route("MAIN_ENTRANCE", "CANTEEN")
    assert route_data["success"] is True
    assert route_data["source"] == "MAIN_ENTRANCE"
    assert route_data["destination"] == "CANTEEN"
    assert route_data["floors_crossed"] == 0
    assert "MAIN_ENTRANCE" in route_data["route"]
    assert "CANTEEN" in route_data["route"]
    assert len(route_data["instructions"]) > 0
    assert route_data["distance"] > 0

def test_campus_multi_floor_route_ground_to_first():
    # Route from MAIN_ENTRANCE (Floor 0) to CSE_LAB_1 (Floor 1)
    route_data = get_navigation_route("MAIN_ENTRANCE", "CSE_LAB_1")
    assert route_data["success"] is True
    assert route_data["source_floor"] == 0
    assert route_data["destination_floor"] == 1
    assert route_data["floors_crossed"] == 1
    assert 0 in route_data["floors_in_route"]
    assert 1 in route_data["floors_in_route"]
    # Path should include a stair or lift transition
    has_vertical_link = any("STAIR" in node or "LIFT" in node for node in route_data["route"])
    assert has_vertical_link is True
    assert len(route_data["instructions"]) >= 3

def test_campus_multi_floor_route_ground_to_second():
    # Route from MAIN_ENTRANCE (Floor 0) to VLSI Lab (ECE_LAB_1, Floor 2)
    route_data = get_navigation_route("MAIN_ENTRANCE", "ECE_LAB_1")
    assert route_data["success"] is True
    assert route_data["source_floor"] == 0
    assert route_data["destination_floor"] == 2
    assert route_data["floors_crossed"] == 2
    assert 2 in route_data["floors_in_route"]
    assert route_data["estimated_time_seconds"] > 0

def test_invalid_source_or_destination():
    res1 = get_navigation_route("INVALID_SRC", "CSE_LAB_1")
    assert res1["success"] is False
    assert "does not exist" in res1["error"]

    res2 = get_navigation_route("MAIN_ENTRANCE", "NON_EXISTENT_DEST")
    assert res2["success"] is False
    assert "does not exist" in res2["error"]

def test_walking_time_calculation():
    seconds, time_str = calculate_estimated_walking_time(72.0, floors_crossed=0)
    assert seconds == 60  # 72m at 1.2m/s = 60s = 1 min
    assert "1 min" in time_str

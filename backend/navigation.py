import heapq
import math
from database import get_db_connection

def build_graph_from_db():
    """
    Constructs an adjacency list graph from the SQLite connections table.
    Returns:
        graph: dict mapping node -> dict(neighbor -> {"distance": float, "hint": str})
        locations_meta: dict mapping location_code -> location dict (with name, floor, type, x, y)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM locations")
    locations_list = cursor.fetchall()
    locations_meta = {row["location_code"]: dict(row) for row in locations_list}
    
    cursor.execute("SELECT source_location, destination_location, distance, direction_hint FROM connections")
    connections_list = cursor.fetchall()
    conn.close()
    
    graph = {code: {} for code in locations_meta.keys()}
    
    for row in connections_list:
        src = row["source_location"]
        dst = row["destination_location"]
        dist = float(row["distance"])
        hint = row["direction_hint"] or ""
        
        if src in graph and dst in graph:
            graph[src][dst] = {"distance": dist, "hint": hint}
            
    return graph, locations_meta


def dijkstra(graph, start, destination):
    """
    Manual Dijkstra's shortest path algorithm implementation.
    
    Args:
        graph: dict of {node: {neighbor: {'distance': float, ...} or float}}
        start: starting node identifier
        destination: target node identifier
        
    Returns:
        (total_distance, path_nodes) or (float('inf'), []) if unreachable.
    """
    if start not in graph or destination not in graph:
        return float('inf'), []
        
    if start == destination:
        return 0.0, [start]
        
    # Min-heap priority queue storing (distance, current_node)
    pq = [(0.0, start)]
    distances = {node: float('inf') for node in graph}
    distances[start] = 0.0
    previous_nodes = {node: None for node in graph}
    visited = set()
    
    while pq:
        current_distance, current_node = heapq.heappop(pq)
        
        if current_node in visited:
            continue
        visited.add(current_node)
        
        if current_node == destination:
            break
            
        if current_distance > distances[current_node]:
            continue
            
        for neighbor, edge_data in graph[current_node].items():
            weight = edge_data["distance"] if isinstance(edge_data, dict) else float(edge_data)
            new_distance = current_distance + weight
            
            if new_distance < distances[neighbor]:
                distances[neighbor] = new_distance
                previous_nodes[neighbor] = current_node
                heapq.heappush(pq, (new_distance, neighbor))
                
    if distances[destination] == float('inf'):
        return float('inf'), []
        
    # Reconstruct path from destination to start
    path = []
    curr = destination
    while curr is not None:
        path.append(curr)
        curr = previous_nodes[curr]
    path.reverse()
    
    return distances[destination], path


def format_floor_name(floor_num):
    if floor_num == 0:
        return "Ground Floor"
    elif floor_num == 1:
        return "First Floor"
    elif floor_num == 2:
        return "Second Floor"
    elif floor_num == 3:
        return "Third Floor"
    elif floor_num < 0:
        return f"Basement {abs(floor_num)}"
    else:
        return f"Floor {floor_num}"


def generate_turn_by_turn_instructions(path, graph, locations_meta):
    """
    Generates human-readable, step-by-step turn-by-turn navigation instructions,
    including floor change transitions, directional hints, and distance callouts.
    """
    if not path:
        return []
        
    if len(path) == 1:
        loc = locations_meta.get(path[0], {})
        return [f"You are already at {loc.get('name', path[0])}."]
        
    instructions = []
    start_loc = locations_meta.get(path[0], {})
    start_floor_name = format_floor_name(start_loc.get('floor', 0))
    instructions.append(f"Start at {start_loc.get('name', path[0])} on {start_floor_name}.")
    
    for i in range(len(path) - 1):
        u = path[i]
        v = path[i + 1]
        
        u_meta = locations_meta.get(u, {})
        v_meta = locations_meta.get(v, {})
        
        edge_data = graph.get(u, {}).get(v, {})
        dist = edge_data.get("distance", 0.0) if isinstance(edge_data, dict) else float(edge_data)
        custom_hint = edge_data.get("hint", "") if isinstance(edge_data, dict) else ""
        
        u_floor = u_meta.get('floor', 0)
        v_floor = v_meta.get('floor', 0)
        v_type = v_meta.get('type', '')
        v_name = v_meta.get('name', v)
        
        # Check for vertical floor transition
        if u_floor != v_floor:
            v_floor_name = format_floor_name(v_floor)
            if "LIFT" in u or "ELEVATOR" in u or v_type == "elevator":
                direction = "up" if v_floor > u_floor else "down"
                instructions.append(f"Take the Elevator {direction} to {v_floor_name}.")
            elif "STAIR" in u or v_type == "staircase":
                direction = "up" if v_floor > u_floor else "down"
                instructions.append(f"Take {u_meta.get('name', 'the staircase')} {direction} to {v_floor_name}.")
            else:
                instructions.append(f"Transition from {format_floor_name(u_floor)} to {v_floor_name}.")
            continue
            
        # If there's an explicit custom hint recorded
        if custom_hint and ("up to" not in custom_hint.lower() and "down to" not in custom_hint.lower()):
            instructions.append(f"{custom_hint} ({dist:.0f}m).")
        else:
            # Fallback heuristic instruction
            if i == len(path) - 2:
                instructions.append(f"Walk {dist:.0f}m straight to reach {v_name}.")
            elif v_type == "corridor":
                instructions.append(f"Continue along {v_name} for {dist:.0f}m.")
            elif v_type in ["staircase", "elevator"]:
                instructions.append(f"Head toward {v_name} ({dist:.0f}m).")
            else:
                instructions.append(f"Proceed toward {v_name} ({dist:.0f}m).")
                
    dest_loc = locations_meta.get(path[-1], {})
    instructions.append(f"Arrive at destination: {dest_loc.get('name', path[-1])} on {format_floor_name(dest_loc.get('floor', 0))}.")
    
    return instructions


def calculate_estimated_walking_time(total_distance, floors_crossed, vertical_transition_seconds=0):
    """
    Calculates walking time in minutes and seconds:
    - Average walking speed: 1.2 m/s (approx 72 m/min)
    - Stair transition delay: 15s per floor crossed
    - Elevator transition delay: 25s per floor crossed
    """
    walking_seconds = total_distance / 1.2
    vertical_seconds = vertical_transition_seconds
    total_seconds = int(walking_seconds + vertical_seconds)
    
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    
    if minutes == 0:
        time_str = f"{seconds} sec"
    elif seconds == 0:
        time_str = f"{minutes} min"
    else:
        time_str = f"{minutes} min {seconds} sec"
        
    return total_seconds, time_str


def get_navigation_route(source_code, dest_code):
    """
    Main entry point for calculating complete navigation route package.
    """
    src = source_code.upper().strip()
    dst = dest_code.upper().strip()
    
    graph, locations_meta = build_graph_from_db()
    
    if src not in locations_meta:
        return {
            "success": False,
            "error": f"Source location '{src}' does not exist."
        }
        
    if dst not in locations_meta:
        return {
            "success": False,
            "error": f"Destination location '{dst}' does not exist."
        }
        
    distance, path = dijkstra(graph, src, dst)
    
    if math.isinf(distance) or not path:
        return {
            "success": False,
            "error": f"No route available between '{locations_meta[src]['name']}' and '{locations_meta[dst]['name']}'."
        }
        
    # Extract path nodes with full coordinates and metadata
    path_nodes = []
    floors_in_route = []
    floor_segments = {}
    
    for code in path:
        meta = locations_meta[code]
        node_info = {
            "location_code": code,
            "name": meta["name"],
            "building": meta["building"],
            "floor": meta["floor"],
            "floor_name": format_floor_name(meta["floor"]),
            "type": meta["type"],
            "x_coordinate": meta["x_coordinate"],
            "y_coordinate": meta["y_coordinate"],
            "description": meta.get("description", "")
        }
        path_nodes.append(node_info)
        
        fl = meta["floor"]
        if fl not in floors_in_route:
            floors_in_route.append(fl)
            
        if fl not in floor_segments:
            floor_segments[fl] = []
        floor_segments[fl].append(node_info)
        
    floors_crossed = abs(locations_meta[dst]["floor"] - locations_meta[src]["floor"])
    vertical_transition_seconds = 0
    for current_code, next_code in zip(path, path[1:]):
        current_location = locations_meta[current_code]
        next_location = locations_meta[next_code]
        if current_location["floor"] == next_location["floor"]:
            continue
        uses_elevator = (
            current_location["type"] == "elevator"
            or next_location["type"] == "elevator"
            or "LIFT" in current_code
            or "LIFT" in next_code
        )
        vertical_transition_seconds += 25 if uses_elevator else 15

    total_seconds, time_str = calculate_estimated_walking_time(
        distance,
        floors_crossed,
        vertical_transition_seconds,
    )
    instructions = generate_turn_by_turn_instructions(path, graph, locations_meta)
    
    return {
        "success": True,
        "source": src,
        "source_name": locations_meta[src]["name"],
        "source_floor": locations_meta[src]["floor"],
        "destination": dst,
        "destination_name": locations_meta[dst]["name"],
        "destination_floor": locations_meta[dst]["floor"],
        "distance": round(distance, 1),
        "distance_unit": "meters",
        "estimated_time_seconds": total_seconds,
        "estimated_time": time_str,
        "floors_crossed": floors_crossed,
        "floors_in_route": floors_in_route,
        "route": path,
        "path_nodes": path_nodes,
        "floor_segments": floor_segments,
        "instructions": instructions
    }

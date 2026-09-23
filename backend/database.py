import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            building TEXT NOT NULL,
            floor INTEGER NOT NULL,
            type TEXT NOT NULL,
            x_coordinate REAL NOT NULL,
            y_coordinate REAL NOT NULL,
            description TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_location TEXT NOT NULL,
            destination_location TEXT NOT NULL,
            distance REAL NOT NULL,
            direction_hint TEXT,
            FOREIGN KEY (source_location) REFERENCES locations (location_code) ON DELETE CASCADE,
            FOREIGN KEY (destination_location) REFERENCES locations (location_code) ON DELETE CASCADE,
            UNIQUE(source_location, destination_location)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS qr_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_code TEXT UNIQUE NOT NULL,
            qr_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (location_code) REFERENCES locations (location_code) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()

def seed_sample_data(force=False):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM locations")
    count = cursor.fetchone()[0]

    if count > 0 and not force:
        conn.close()
        return

    if force:
        cursor.execute("DELETE FROM connections")
        cursor.execute("DELETE FROM qr_codes")
        cursor.execute("DELETE FROM locations")

    # Sample Building: "ABC Engineering College - Main Block"
    # Floors: Ground Floor (0), First Floor (1), Second Floor (2)
    # Coordinate system: Canvas size 800 x 600
    locations_data = [
        # --- Ground Floor (Floor 0) ---
        ("MAIN_ENTRANCE", "Main Entrance", "Main Building", 0, "entrance", 400, 540, "Primary campus entrance gateway with security desk"),
        ("RECEPTION", "Reception & Information Desk", "Main Building", 0, "reception", 400, 440, "Help desk for visitor inquiries and campus directory"),
        ("CANTEEN", "College Canteen & Cafeteria", "Main Building", 0, "canteen", 160, 440, "Dining hall serving hot meals, snacks, and beverages"),
        ("AUDITORIUM", "Main Auditorium", "Main Building", 0, "auditorium", 640, 440, "500-seat multi-purpose hall for events and seminars"),
        ("ADMIN_OFFICE", "Administrative Office", "Main Building", 0, "office", 160, 300, "Administrative desk for admissions and student affairs"),
        ("CORRIDOR_G1", "Central Corridor Ground", "Main Building", 0, "corridor", 400, 340, "Central walkway connecting reception to lifts and stairs"),
        ("CORRIDOR_G_WEST", "West Wing Corridor Ground", "Main Building", 0, "corridor", 260, 340, "Hallway linking admin office and canteen"),
        ("CORRIDOR_G_EAST", "East Wing Corridor Ground", "Main Building", 0, "corridor", 540, 340, "Hallway linking auditorium and East Staircase"),
        ("STAIR_1", "Staircase 1 (West Wing)", "Main Building", 0, "staircase", 260, 220, "Ground floor west stairwell leading to First & Second Floors"),
        ("STAIR_2", "Staircase 2 (East Wing)", "Main Building", 0, "staircase", 540, 220, "Ground floor east stairwell leading to First & Second Floors"),
        ("LIFT_1", "Central Elevator Lift 1", "Main Building", 0, "elevator", 400, 220, "Access to all floors (Ground, First, Second)"),

        # --- First Floor (Floor 1) ---
        ("CSE_DEPT", "CSE Department Office", "Main Building", 1, "department", 400, 340, "Computer Science & Engineering Department HOD & Staff Office"),
        ("CSE_LAB_1", "Computer Science Lab 1 (AI & ML)", "Main Building", 1, "laboratory", 160, 200, "High-performance computing lab for Artificial Intelligence"),
        ("CSE_LAB_2", "Computer Science Lab 2 (Software Engineering)", "Main Building", 1, "laboratory", 160, 420, "Full-stack development and systems programming lab"),
        ("CSE_CLASS_101", "Classroom 101 (Final Year CSE)", "Main Building", 1, "classroom", 640, 200, "Smart classroom equipped with projector and audio systems"),
        ("CSE_CLASS_102", "Classroom 102 (Third Year CSE)", "Main Building", 1, "classroom", 640, 420, "Interactive multimedia lecture hall"),
        ("LIBRARY", "Central Digital Library", "Main Building", 1, "library", 400, 140, "Digital learning resource center and reading hall"),
        ("FACULTY_ROOM_1", "CSE Faculty Room", "Main Building", 1, "office", 160, 520, "Faculty workstations and student consultation area"),
        ("CORRIDOR_F1_CENTRAL", "Central Corridor First Floor", "Main Building", 1, "corridor", 400, 250, "Main central junction outside CSE Dept and Library"),
        ("CORRIDOR_F1_WEST", "West Wing Corridor First Floor", "Main Building", 1, "corridor", 260, 340, "Access walkway for CSE Lab 1 and Lab 2"),
        ("CORRIDOR_F1_EAST", "East Wing Corridor First Floor", "Main Building", 1, "corridor", 540, 340, "Access walkway for Classrooms 101 and 102"),
        ("STAIR_1_F1", "Staircase 1 (First Floor)", "Main Building", 1, "staircase", 260, 220, "West stairwell connecting to Ground and Second Floor"),
        ("STAIR_2_F1", "Staircase 2 (First Floor)", "Main Building", 1, "staircase", 540, 220, "East stairwell connecting to Ground and Second Floor"),
        ("LIFT_1_F1", "Central Elevator Lift 1 (First Floor)", "Main Building", 1, "elevator", 400, 220, "First floor elevator lobby"),

        # --- Second Floor (Floor 2) ---
        ("ECE_DEPT", "ECE Department Office", "Main Building", 2, "department", 260, 340, "Electronics & Communication Engineering Department Office"),
        ("ECE_LAB_1", "VLSI & Embedded Systems Lab", "Main Building", 2, "laboratory", 160, 200, "Electronics circuit design and IoT hardware lab"),
        ("MECH_DEPT", "Mechanical Engineering Department", "Main Building", 2, "department", 540, 340, "Mechanical Engineering Department HOD & Staff Office"),
        ("SEMINAR_HALL", "Executive Seminar Hall", "Main Building", 2, "auditorium", 640, 200, "Air-conditioned seminar and guest lecture hall"),
        ("RESEARCH_LAB", "Advanced Robotics & Research Lab", "Main Building", 2, "laboratory", 400, 140, "Postgraduate research and innovation incubator"),
        ("CORRIDOR_F2_CENTRAL", "Central Corridor Second Floor", "Main Building", 2, "corridor", 400, 250, "Junction connecting Robotics lab, Lifts, and wings"),
        ("CORRIDOR_F2_WEST", "West Wing Corridor Second Floor", "Main Building", 2, "corridor", 260, 280, "Hallway for ECE Department and VLSI Lab"),
        ("CORRIDOR_F2_EAST", "East Wing Corridor Second Floor", "Main Building", 2, "corridor", 540, 280, "Hallway for Mechanical Dept and Seminar Hall"),
        ("STAIR_1_F2", "Staircase 1 (Second Floor)", "Main Building", 2, "staircase", 260, 220, "West stairwell top landing on Second Floor"),
        ("STAIR_2_F2", "Staircase 2 (Second Floor)", "Main Building", 2, "staircase", 540, 220, "East stairwell top landing on Second Floor"),
        ("LIFT_1_F2", "Central Elevator Lift 1 (Second Floor)", "Main Building", 2, "elevator", 400, 220, "Second floor elevator lobby"),
    ]

    cursor.executemany("""
        INSERT INTO locations (location_code, name, building, floor, type, x_coordinate, y_coordinate, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, locations_data)

    # Helper function to add bi-directional edges
    raw_edges = [
        # --- Ground Floor Connections ---
        ("MAIN_ENTRANCE", "RECEPTION", 12.0, "Walk straight ahead into the lobby"),
        ("RECEPTION", "CORRIDOR_G1", 10.0, "Continue past reception towards central hallway"),
        ("RECEPTION", "CANTEEN", 25.0, "Turn left and walk down the West hallway to the Canteen"),
        ("RECEPTION", "AUDITORIUM", 25.0, "Turn right and walk down the East hallway to the Auditorium"),
        ("CORRIDOR_G1", "CORRIDOR_G_WEST", 15.0, "Turn left toward the West corridor"),
        ("CORRIDOR_G1", "CORRIDOR_G_EAST", 15.0, "Turn right toward the East corridor"),
        ("CORRIDOR_G1", "LIFT_1", 12.0, "Walk straight to the central elevator lobby"),
        ("CORRIDOR_G_WEST", "ADMIN_OFFICE", 12.0, "Walk west into the Administrative Office"),
        ("CORRIDOR_G_WEST", "CANTEEN", 15.0, "Walk south-west toward Canteen dining area"),
        ("CORRIDOR_G_WEST", "STAIR_1", 14.0, "Walk north towards West Staircase 1"),
        ("CORRIDOR_G_EAST", "AUDITORIUM", 15.0, "Walk south-east to enter Main Auditorium"),
        ("CORRIDOR_G_EAST", "STAIR_2", 14.0, "Walk north towards East Staircase 2"),
        ("LIFT_1", "CORRIDOR_G_WEST", 16.0, "Walk left from elevator toward West stairs"),
        ("LIFT_1", "CORRIDOR_G_EAST", 16.0, "Walk right from elevator toward East stairs"),

        # --- First Floor Connections ---
        ("CORRIDOR_F1_CENTRAL", "LIFT_1_F1", 8.0, "Head to the central elevator lobby"),
        ("CORRIDOR_F1_CENTRAL", "LIBRARY", 14.0, "Walk north straight into the Central Digital Library"),
        ("CORRIDOR_F1_CENTRAL", "CSE_DEPT", 12.0, "Walk south into the CSE Department Office"),
        ("CORRIDOR_F1_CENTRAL", "CORRIDOR_F1_WEST", 16.0, "Head west toward CSE Labs"),
        ("CORRIDOR_F1_CENTRAL", "CORRIDOR_F1_EAST", 16.0, "Head east toward Classrooms"),
        ("CORRIDOR_F1_WEST", "STAIR_1_F1", 14.0, "Walk to West Staircase 1 landing"),
        ("CORRIDOR_F1_WEST", "CSE_LAB_1", 18.0, "Walk north-west into Computer Science Lab 1 (AI & ML)"),
        ("CORRIDOR_F1_WEST", "CSE_LAB_2", 15.0, "Walk south-west into Computer Science Lab 2"),
        ("CORRIDOR_F1_WEST", "FACULTY_ROOM_1", 20.0, "Walk south to the Faculty Room"),
        ("CORRIDOR_F1_EAST", "STAIR_2_F1", 14.0, "Walk to East Staircase 2 landing"),
        ("CORRIDOR_F1_EAST", "CSE_CLASS_101", 18.0, "Walk north-east into Classroom 101"),
        ("CORRIDOR_F1_EAST", "CSE_CLASS_102", 15.0, "Walk south-east into Classroom 102"),
        ("CSE_DEPT", "CORRIDOR_F1_WEST", 16.0, "Exit CSE Dept westward"),
        ("CSE_DEPT", "CORRIDOR_F1_EAST", 16.0, "Exit CSE Dept eastward"),

        # --- Second Floor Connections ---
        ("CORRIDOR_F2_CENTRAL", "LIFT_1_F2", 8.0, "Head to the second floor elevator lobby"),
        ("CORRIDOR_F2_CENTRAL", "RESEARCH_LAB", 14.0, "Walk north into Robotics & Research Lab"),
        ("CORRIDOR_F2_CENTRAL", "CORRIDOR_F2_WEST", 16.0, "Head west toward ECE Department"),
        ("CORRIDOR_F2_CENTRAL", "CORRIDOR_F2_EAST", 16.0, "Head east toward Mechanical Department"),
        ("CORRIDOR_F2_WEST", "STAIR_1_F2", 12.0, "Walk to West Staircase 2nd floor landing"),
        ("CORRIDOR_F2_WEST", "ECE_DEPT", 10.0, "Walk south into ECE Department Office"),
        ("CORRIDOR_F2_WEST", "ECE_LAB_1", 16.0, "Walk north-west into VLSI & Embedded Systems Lab"),
        ("CORRIDOR_F2_EAST", "STAIR_2_F2", 12.0, "Walk to East Staircase 2nd floor landing"),
        ("CORRIDOR_F2_EAST", "MECH_DEPT", 10.0, "Walk south into Mechanical Department"),
        ("CORRIDOR_F2_EAST", "SEMINAR_HALL", 16.0, "Walk north-east into Executive Seminar Hall"),

        # --- Multi-Floor Vertical Transitions (Staircases & Elevators) ---
        # Staircase 1 (West) links Floor 0 <-> Floor 1 <-> Floor 2
        ("STAIR_1", "STAIR_1_F1", 15.0, "Climb Staircase 1 up to First Floor"),
        ("STAIR_1_F1", "STAIR_1_F2", 15.0, "Climb Staircase 1 up to Second Floor"),

        # Staircase 2 (East) links Floor 0 <-> Floor 1 <-> Floor 2
        ("STAIR_2", "STAIR_2_F1", 15.0, "Climb Staircase 2 up to First Floor"),
        ("STAIR_2_F1", "STAIR_2_F2", 15.0, "Climb Staircase 2 up to Second Floor"),

        # Elevator 1 links Floor 0 <-> Floor 1 <-> Floor 2
        ("LIFT_1", "LIFT_1_F1", 10.0, "Take Elevator Lift 1 to First Floor"),
        ("LIFT_1_F1", "LIFT_1_F2", 10.0, "Take Elevator Lift 1 to Second Floor"),
        ("LIFT_1", "LIFT_1_F2", 18.0, "Take Elevator Lift 1 directly to Second Floor"),
    ]

    # Insert symmetric (bi-directional) connections
    connections_data = []
    seen = set()
    for src, dst, dist, hint in raw_edges:
        if (src, dst) not in seen:
            connections_data.append((src, dst, dist, hint))
            seen.add((src, dst))
        if (dst, src) not in seen:
            # Derive reverse hint
            rev_hint = hint
            if "up to First Floor" in hint:
                rev_hint = "Take Staircase 1 down to Ground Floor"
            elif "up to Second Floor" in hint:
                rev_hint = "Take Staircase down to First Floor"
            elif "to First Floor" in hint:
                rev_hint = "Take Elevator down to Ground Floor"
            elif "to Second Floor" in hint:
                rev_hint = "Take Elevator down"
            connections_data.append((dst, src, dist, rev_hint))
            seen.add((dst, src))

    cursor.executemany("""
        INSERT INTO connections (source_location, destination_location, distance, direction_hint)
        VALUES (?, ?, ?, ?)
    """, connections_data)

    # Seed QR codes for all locations
    base_url = "http://localhost:5173/scan?location="
    qr_data = []
    for loc in locations_data:
        code = loc[0]
        qr_payload = f"{base_url}{code}"
        qr_data.append((code, qr_payload))

    cursor.executemany("""
        INSERT INTO qr_codes (location_code, qr_data)
        VALUES (?, ?)
    """, qr_data)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_sample_data(force=True)
    print("Database initialized and sample data seeded successfully.")

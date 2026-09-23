import sqlite3
from database import get_db_connection

def dict_from_row(row):
    return {k: row[k] for k in row.keys()} if row else None

def get_all_locations(floor=None, location_type=None, search=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM locations WHERE 1=1"
    params = []
    
    if floor is not None:
        query += " AND floor = ?"
        params.append(floor)
        
    if location_type:
        query += " AND type = ?"
        params.append(location_type)
        
    if search:
        query += " AND (name LIKE ? OR location_code LIKE ? OR description LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    query += " ORDER BY floor ASC, name ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]

def get_location_by_code(location_code):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM locations WHERE location_code = ?", (location_code.upper().strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict_from_row(row)

def create_location(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO locations (location_code, name, building, floor, type, x_coordinate, y_coordinate, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data['location_code'].upper().strip(),
        data['name'].strip(),
        data.get('building', 'Main Building').strip(),
        int(data.get('floor', 0)),
        data.get('type', 'room').strip().lower(),
        float(data.get('x_coordinate', 400)),
        float(data.get('y_coordinate', 300)),
        data.get('description', '').strip()
    ))
    conn.commit()
    conn.close()
    return get_location_by_code(data['location_code'])

def update_location(location_code, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE locations
        SET name = ?, building = ?, floor = ?, type = ?, x_coordinate = ?, y_coordinate = ?, description = ?
        WHERE location_code = ?
    """, (
        data['name'].strip(),
        data.get('building', 'Main Building').strip(),
        int(data.get('floor', 0)),
        data.get('type', 'room').strip().lower(),
        float(data.get('x_coordinate', 400)),
        float(data.get('y_coordinate', 300)),
        data.get('description', '').strip(),
        location_code.upper().strip()
    ))
    conn.commit()
    conn.close()
    return get_location_by_code(location_code)

def delete_location(location_code):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM locations WHERE location_code = ?", (location_code.upper().strip(),))
    cursor.execute("DELETE FROM connections WHERE source_location = ? OR destination_location = ?", 
                   (location_code.upper().strip(), location_code.upper().strip()))
    cursor.execute("DELETE FROM qr_codes WHERE location_code = ?", (location_code.upper().strip(),))
    conn.commit()
    conn.close()
    return True

def get_all_connections():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, 
               s.name AS source_name, s.floor AS source_floor,
               d.name AS destination_name, d.floor AS destination_floor
        FROM connections c
        JOIN locations s ON c.source_location = s.location_code
        JOIN locations d ON c.destination_location = d.location_code
        ORDER BY c.id ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]

def create_connection(source, destination, distance, direction_hint="", bidirectional=True):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    src = source.upper().strip()
    dst = destination.upper().strip()
    dist = float(distance)
    
    cursor.execute("""
        INSERT OR REPLACE INTO connections (source_location, destination_location, distance, direction_hint)
        VALUES (?, ?, ?, ?)
    """, (src, dst, dist, direction_hint))
    
    if bidirectional:
        cursor.execute("""
            INSERT OR REPLACE INTO connections (source_location, destination_location, distance, direction_hint)
            VALUES (?, ?, ?, ?)
        """, (dst, src, dist, direction_hint))
        
    conn.commit()
    conn.close()
    return True

def delete_connection(connection_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM connections WHERE id = ?", (connection_id,))
    conn.commit()
    conn.close()
    return True

def get_qr_record(location_code):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM qr_codes WHERE location_code = ?", (location_code.upper().strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict_from_row(row)

def save_or_update_qr(location_code, qr_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO qr_codes (location_code, qr_data)
        VALUES (?, ?)
        ON CONFLICT(location_code) DO UPDATE SET qr_data = excluded.qr_data
    """, (location_code.upper().strip(), qr_data))
    conn.commit()
    conn.close()
    return get_qr_record(location_code)

def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM locations")
    total_locations = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT floor) FROM locations")
    total_floors = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM connections")
    total_connections = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM qr_codes")
    total_qr_codes = cursor.fetchone()[0]
    
    cursor.execute("SELECT floor, COUNT(*) as count FROM locations GROUP BY floor ORDER BY floor ASC")
    floor_dist = {f"Floor {row['floor']}": row['count'] for row in cursor.fetchall()}
    
    cursor.execute("SELECT type, COUNT(*) as count FROM locations GROUP BY type ORDER BY count DESC")
    type_dist = {row['type']: row['count'] for row in cursor.fetchall()}
    
    conn.close()
    return {
        "total_locations": total_locations,
        "total_floors": total_floors,
        "total_connections": total_connections,
        "total_qr_codes": total_qr_codes,
        "floor_distribution": floor_dist,
        "type_distribution": type_dist
    }

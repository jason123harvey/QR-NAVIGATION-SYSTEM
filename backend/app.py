import io
import os
import zipfile
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from database import init_db, seed_sample_data
import models
import navigation
import qr_generator

app = Flask(__name__)
# Enable CORS for all routes and origins (Vite dev server and production)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Ensure database is initialized on startup
with app.app_context():
    init_db()
    seed_sample_data(force=False)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "QR Indoor Navigation API",
        "version": "1.0.0"
    })

# ==========================================
# Location Endpoints
# ==========================================

@app.route("/api/locations", methods=["GET"])
def get_locations():
    floor_param = request.args.get("floor")
    floor = int(floor_param) if floor_param is not None and floor_param != "" else None
    loc_type = request.args.get("type")
    search = request.args.get("search")
    
    locations = models.get_all_locations(floor=floor, location_type=loc_type, search=search)
    return jsonify(locations)

@app.route("/api/locations/<location_code>", methods=["GET"])
def get_location(location_code):
    loc = models.get_location_by_code(location_code)
    if not loc:
        return jsonify({"error": f"Location '{location_code}' not found."}), 404
    return jsonify(loc)

@app.route("/api/locations", methods=["POST"])
def add_location():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON request body."}), 400
        
    code = data.get("location_code", "").upper().strip()
    name = data.get("name", "").strip()
    
    if not code or not name:
        return jsonify({"error": "Both location_code and name are required."}), 400
        
    existing = models.get_location_by_code(code)
    if existing:
        return jsonify({"error": f"Location code '{code}' already exists."}), 409
        
    try:
        new_loc = models.create_location(data)
        # Automatically register QR code for the new location
        base_url = request.host_url.replace("5000", "5173") + "scan?location="
        models.save_or_update_qr(code, f"{base_url}{code}")
        return jsonify(new_loc), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/locations/<location_code>", methods=["PUT"])
def update_location(location_code):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON request body."}), 400
        
    existing = models.get_location_by_code(location_code)
    if not existing:
        return jsonify({"error": f"Location '{location_code}' not found."}), 404
        
    try:
        updated = models.update_location(location_code, data)
        return jsonify(updated)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/locations/<location_code>", methods=["DELETE"])
def delete_location(location_code):
    existing = models.get_location_by_code(location_code)
    if not existing:
        return jsonify({"error": f"Location '{location_code}' not found."}), 404
        
    models.delete_location(location_code)
    return jsonify({"message": f"Location '{location_code}' and associated connections deleted successfully."})

# ==========================================
# Connection / Graph Endpoints
# ==========================================

@app.route("/api/connections", methods=["GET"])
def get_connections():
    connections = models.get_all_connections()
    return jsonify(connections)

@app.route("/api/connections", methods=["POST"])
def add_connection():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON request body."}), 400
        
    src = data.get("source_location")
    dst = data.get("destination_location")
    dist = data.get("distance")
    hint = data.get("direction_hint", "")
    bidirectional = data.get("bidirectional", True)
    
    if not src or not dst or dist is None:
        return jsonify({"error": "source_location, destination_location, and distance are required."}), 400
        
    if not models.get_location_by_code(src):
        return jsonify({"error": f"Source location '{src}' does not exist."}), 400
        
    if not models.get_location_by_code(dst):
        return jsonify({"error": f"Destination location '{dst}' does not exist."}), 400
        
    try:
        models.create_connection(src, dst, dist, hint, bidirectional=bidirectional)
        return jsonify({"message": f"Connection between {src} and {dst} added successfully."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/connections/<int:conn_id>", methods=["DELETE"])
def delete_connection(conn_id):
    models.delete_connection(conn_id)
    return jsonify({"message": f"Connection {conn_id} deleted."})

# ==========================================
# Navigation & Routing Endpoint
# ==========================================

@app.route("/api/navigation/route", methods=["POST"])
def compute_route():
    data = request.get_json() or {}
    source = data.get("source", "").strip()
    destination = data.get("destination", "").strip()
    
    if not source or not destination:
        return jsonify({
            "success": False,
            "error": "Both 'source' and 'destination' location codes are required."
        }), 400
        
    result = navigation.get_navigation_route(source, destination)
    
    if not result["success"]:
        return jsonify(result), 404
        
    return jsonify(result)

# ==========================================
# QR Code Endpoints
# ==========================================

@app.route("/api/qr/<location_code>", methods=["GET"])
def get_qr(location_code):
    loc = models.get_location_by_code(location_code)
    if not loc:
        return jsonify({"error": f"Location '{location_code}' not found."}), 404
        
    base_url = request.args.get("base_url") or (request.host_url.replace(":5000", ":5173").rstrip("/") + "/scan?location=")
    b64_img, payload = qr_generator.generate_qr_base64(
        location_code=loc["location_code"],
        base_url=base_url,
        location_name=loc["name"]
    )
    
    return jsonify({
        "location_code": loc["location_code"],
        "name": loc["name"],
        "floor": loc["floor"],
        "qr_payload": payload,
        "qr_image_base64": b64_img
    })

@app.route("/api/qr/<location_code>/download", methods=["GET"])
def download_qr_image(location_code):
    loc = models.get_location_by_code(location_code)
    if not loc:
        return jsonify({"error": f"Location '{location_code}' not found."}), 404
        
    base_url = request.args.get("base_url") or (request.host_url.replace(":5000", ":5173").rstrip("/") + "/scan?location=")
    img_buffer = qr_generator.generate_qr_bytes(
        location_code=loc["location_code"],
        base_url=base_url,
        location_name=loc["name"]
    )
    
    return send_file(
        img_buffer,
        mimetype="image/png",
        as_attachment=True,
        download_name=f"QR_{loc['location_code']}.png"
    )

@app.route("/api/qr/batch/download", methods=["GET"])
def download_qr_batch():
    requested_codes = [
        code.strip().upper()
        for code in request.args.get("locations", "").split(",")
        if code.strip()
    ]
    locations = models.get_all_locations()
    if requested_codes:
        locations = [loc for loc in locations if loc["location_code"] in requested_codes]
    if not locations:
        return jsonify({"error": "No matching locations found."}), 404

    base_url = request.args.get("base_url") or (request.host_url.replace(":5000", ":5173").rstrip("/") + "/scan?location=")
    archive = io.BytesIO()
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as batch:
        for loc in locations:
            image = qr_generator.generate_qr_bytes(
                location_code=loc["location_code"],
                base_url=base_url,
                location_name=loc["name"],
            )
            batch.writestr(f"QR_{loc['location_code']}.png", image.getvalue())
    archive.seek(0)

    return send_file(
        archive,
        mimetype="application/zip",
        as_attachment=True,
        download_name="NaviQR_codes.zip",
    )

# ==========================================
# Admin & Dashboard Stats
# ==========================================

@app.route("/api/stats", methods=["GET"])
def get_stats():
    stats = models.get_stats()
    return jsonify(stats)

@app.route("/api/admin/reset-db", methods=["POST"])
def reset_database():
    try:
        seed_sample_data(force=True)
        return jsonify({"message": "Database reset and seeded with default college building map successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

import qrcode
import io
import os
import base64
# pyrefly: ignore [missing-import]
from PIL import Image, ImageDraw, ImageFont
frontend_url = os.environ.get(
    "FRONTEND_URL",
    "http://localhost:5173"
).rstrip("/")


def get_default_scan_base_url():
    base = os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{base}/scan?location="


def generate_qr_image(location_code, base_url=None, include_label=True, location_name=""):
    """
    Generates a QR code Pillow Image object for the specified location code.
    Optionally embeds a text label beneath the QR code for easy physical printing.
    Returns (Image, payload_url)
    """
    if base_url is None:
        base_url = get_default_scan_base_url()

    qr_payload = f"{base_url}{location_code}"
    
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(qr_payload)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="#0f172a", back_color="#ffffff").convert("RGB")
    
    if include_label:
        w, h = qr_img.size
        banner_h = 70
        new_img = Image.new("RGB", (w, h + banner_h), "#ffffff")
        new_img.paste(qr_img, (0, 0))
        
        draw = ImageDraw.Draw(new_img)
        label_text = location_name if location_name else location_code
        sub_text = f"Indoor Node: {location_code}"
        
        # Draw decorative bottom banner
        draw.line([(20, h), (w - 20, h)], fill="#e2e8f0", width=2)
        draw.text((w // 2, h + 15), label_text[:28], fill="#0f172a", anchor="mt")
        draw.text((w // 2, h + 42), sub_text[:35], fill="#64748b", anchor="mt")
        
        return new_img, qr_payload
        
    return qr_img, qr_payload

def generate_qr_base64(location_code, base_url=None, location_name=""):
    """
    Returns (base64_data_url, payload_url)
    """
    if base_url is None:
        base_url = get_default_scan_base_url()
    img, payload = generate_qr_image(location_code, base_url=base_url, include_label=True, location_name=location_name)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}", payload

def generate_qr_bytes(location_code, base_url=None, location_name=""):
    """
    Returns BytesIO buffer for HTTP file downloads and streaming.
    """
    if base_url is None:
        base_url = get_default_scan_base_url()
    img, payload = generate_qr_image(location_code, base_url=base_url, include_label=True, location_name=location_name)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer

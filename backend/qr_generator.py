import qrcode
import io
import base64
# pyrefly: ignore [missing-import]
from PIL import Image, ImageDraw, ImageFont

def generate_qr_image(location_code, base_url="http://localhost:5173/scan?location=", include_label=True, location_name=""):
    """
    Generates a QR code Pillow Image object for the specified location code.
    Optionally embeds a text label beneath the QR code for easy physical printing.
    """
    qr_payload = f"{base_url}{location_code.upper().strip()}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_payload)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="#1e1b4b", back_color="#ffffff").convert("RGB")
    
    if include_label:
        # Create extended canvas with label
        w, h = qr_img.size
        extra_h = 70
        canvas = Image.new("RGB", (w, h + extra_h), "#ffffff")
        canvas.paste(qr_img, (0, 0))
        
        draw = ImageDraw.Draw(canvas)
        label_text = location_name if location_name else location_code
        sub_text = f"Scan to Navigate • {location_code}"
        
        # Draw decorative bottom banner
        draw.line([(20, h), (w - 20, h)], fill="#e2e8f0", width=2)
        draw.text((w // 2, h + 15), label_text[:28], fill="#0f172a", anchor="mt")
        draw.text((w // 2, h + 42), sub_text[:35], fill="#64748b", anchor="mt")
        
        return canvas, qr_payload
        
    return qr_img, qr_payload

def generate_qr_base64(location_code, base_url="http://localhost:5173/scan?location=", location_name=""):
    """
    Returns (base64_data_url, payload_url)
    """
    img, payload = generate_qr_image(location_code, base_url=base_url, location_name=location_name)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}", payload

def generate_qr_bytes(location_code, base_url="http://localhost:5173/scan?location=", location_name=""):
    """
    Returns raw PNG bytes for HTTP file downloads.
    """
    img, _ = generate_qr_image(location_code, base_url=base_url, location_name=location_name)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer

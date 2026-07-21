from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import random
from datetime import datetime
import base64
import os
import io

try:
    import requests as http_requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

#  - -‚- - -‚- Gemini API setup  - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚- - -‚-
# Set your Gemini API key here OR as env var GEMINI_API_KEY
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCFqIz14Mq9EFVYFBCRAlzWHAVxsO2_JlE")
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'dist'))
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/dist'))

app = Flask(__name__, static_folder=DIST_DIR if os.path.exists(DIST_DIR) else None, static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Endpoint not found'}), 404
    if app.static_folder and path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    elif app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    else:
        return jsonify({
            'status': 'online',
            'service': 'JanRakshak AI Backend API',
            'message': '🌱 JanRakshak AI API is running successfully on Render!',
            'version': '1.0.0'
        })

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    
    age = float(data.get('age', 0))
    weight = float(data.get('weight', 0))
    systolic = float(data.get('systolic', 0))
    diastolic = float(data.get('diastolic', 0))
    glucose = float(data.get('glucose', 0))
    hemoglobin = float(data.get('hemoglobin', 0))
    lat = data.get('lat', '')
    lng = data.get('lng', '')

    # Enhanced logic with percentages and explainability
    
    # Heart Risk Logic
    heart_score = 10
    if systolic > 140: heart_score += 30
    if diastolic > 90: heart_score += 20
    if age > 50: heart_score += 15
    heart_score = min(heart_score, 95)
    
    heart_risk = "Low"
    heart_color = "green"
    if heart_score > 40: heart_risk, heart_color = "Moderate", "yellow"
    if heart_score > 70: heart_risk, heart_color = "High", "red"
    
    # Diabetes Logic (weight > 80kg adds obesity risk)
    diabetes_score = 15
    if glucose > 140: diabetes_score += 40
    if glucose > 180: diabetes_score += 30
    if weight > 80: diabetes_score += 10
    if weight > 100: diabetes_score += 10
    diabetes_score = min(diabetes_score, 95)
    
    diabetes_risk = "Low"
    diabetes_color = "green"
    if diabetes_score > 40: diabetes_risk, diabetes_color = "Moderate", "yellow"
    if diabetes_score > 70: diabetes_risk, diabetes_color = "High", "red"
    
    # Anemia Logic
    anemia_score = 10
    if hemoglobin < 12: anemia_score += 40
    if hemoglobin < 10: anemia_score += 40
    anemia_score = min(anemia_score, 95)
    
    anemia_risk = "Low"
    anemia_color = "green"
    if anemia_score > 40: anemia_risk, anemia_color = "Moderate", "yellow"
    if anemia_score > 70: anemia_risk, anemia_color = "High", "red"

    #  - -- - -- - -- Medicine Prescriptions  - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - --
    prescriptions = []

    # Heart Disease Prescriptions
    if heart_risk == "High":
        prescriptions.append({
            "condition": "Heart Disease",
            "color": "#ff4d4d",
            "medicines": [
                {"name": "Amlodipine 5mg",   "brand": "Amlokind-5 / Amlogard",  "type": "Calcium Channel Blocker", "dose": "1 tablet", "frequency": "Once daily (morning)",          "duration": "As prescribed",        "warning": "Monitor blood pressure regularly"},
                {"name": "Aspirin 75mg",      "brand": "Ecosprin 75",            "type": "Antiplatelet",            "dose": "1 tablet", "frequency": "Once daily (after food)",        "duration": "Long-term",            "warning": "Avoid if stomach ulcer history"},
                {"name": "Atorvastatin 10mg", "brand": "Atorva 10 / Lipitor",    "type": "Statin (Cholesterol)",    "dose": "1 tablet", "frequency": "Once daily (night)",             "duration": "As prescribed",        "warning": "Report any muscle pain immediately"},
            ]
        })
    elif heart_risk == "Moderate":
        prescriptions.append({
            "condition": "Heart Disease",
            "color": "#f4a261",
            "medicines": [
                {"name": "Amlodipine 2.5mg",  "brand": "Amlokind-2.5",           "type": "Calcium Channel Blocker", "dose": "1 tablet", "frequency": "Once daily (morning)",          "duration": "3 months, then review", "warning": "Do not stop suddenly"},
                {"name": "Lifestyle Advice",  "brand": " - ",                      "type": "Non-Pharmacological",     "dose": " - ",        "frequency": "Daily",                         "duration": "Ongoing",               "warning": "Reduce salt, walk 30 mins/day"},
            ]
        })

    # Diabetes Prescriptions
    if diabetes_risk == "High":
        prescriptions.append({
            "condition": "Diabetes",
            "color": "#ff4d4d",
            "medicines": [
                {"name": "Metformin 500mg",   "brand": "Glycomet 500 / Obimet",  "type": "Biguanide",               "dose": "1 tablet", "frequency": "Twice daily (with meals)",       "duration": "Long-term",            "warning": "Stop if severe vomiting or kidney issues"},
                {"name": "Glipizide 5mg",     "brand": "Glynase 5 / Dibizide",   "type": "Sulfonylurea",            "dose": "1 tablet", "frequency": "Once daily (30 min before breakfast)", "duration": "As prescribed",   "warning": "Monitor blood sugar; risk of hypoglycemia"},
                {"name": "Vitamin B12 500mcg","brand": "Rejunuron / Neurobion",  "type": "Supplement",              "dose": "1 tablet", "frequency": "Once daily",                    "duration": "3 months",             "warning": "Important with Metformin to prevent B12 deficiency"},
            ]
        })
    elif diabetes_risk == "Moderate":
        prescriptions.append({
            "condition": "Diabetes",
            "color": "#f4a261",
            "medicines": [
                {"name": "Metformin 500mg",   "brand": "Glycomet 500 / Obimet",  "type": "Biguanide",               "dose": "1 tablet", "frequency": "Once daily (with dinner)",       "duration": "3 months, then review", "warning": "Take with food to reduce nausea"},
                {"name": "Diet Counseling",   "brand": " - ",                      "type": "Non-Pharmacological",     "dose": " - ",        "frequency": "Daily",                         "duration": "Ongoing",               "warning": "Avoid sugar, refined carbs; increase fiber intake"},
            ]
        })

    # Anemia Prescriptions
    if anemia_risk == "High":
        prescriptions.append({
            "condition": "Anemia",
            "color": "#ff4d4d",
            "medicines": [
                {"name": "Ferrous Sulphate 200mg","brand": "Dexorange / Orofer S",  "type": "Iron Supplement",    "dose": "1 tablet", "frequency": "Twice daily (between meals)",    "duration": "3-6 months",           "warning": "May cause dark stools; take with Vitamin C"},
                {"name": "Folic Acid 5mg",         "brand": "Folvite 5mg",           "type": "Vitamin B9",         "dose": "1 tablet", "frequency": "Once daily",                    "duration": "3 months",             "warning": "Essential for red blood cell formation"},
                {"name": "Vitamin C 500mg",        "brand": "Celin 500 / Limcee",    "type": "Supplement",         "dose": "1 tablet", "frequency": "Twice daily (with iron tablet)", "duration": "3 months",             "warning": "Enhances iron absorption significantly"},
            ]
        })
    elif anemia_risk == "Moderate":
        prescriptions.append({
            "condition": "Anemia",
            "color": "#f4a261",
            "medicines": [
                {"name": "Ferrous Sulphate 100mg","brand": "Dexorange / Orofer",    "type": "Iron Supplement",    "dose": "1 tablet", "frequency": "Once daily (morning, empty stomach)", "duration": "2 months, then review", "warning": "Consume iron-rich foods: spinach, jaggery, lentils"},
            ]
        })

    if not prescriptions:
        prescriptions.append({
            "condition": "General Wellness",
            "color": "#40916c",
            "medicines": [
                {"name": "Multivitamin", "brand": "Supradyn / Revital H", "type": "Supplement", "dose": "1 tablet", "frequency": "Once daily (morning)", "duration": "1 month", "warning": "Maintain a balanced diet and regular physical activity"},
            ]
        })

    #  - -- - -- - -- Reverse geocode to get real area name  - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - --
    area = ''
    district = ''
    state = ''
    if lat and lng and REQUESTS_AVAILABLE:
        try:
            geo_resp = http_requests.get(
                f'https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json',
                headers={'User-Agent': 'JanRakshak-AI/1.0', 'Accept-Language': 'en'},
                timeout=5
            )
            geo_data = geo_resp.json()
            addr = geo_data.get('address', {})
            area     = addr.get('suburb') or addr.get('village') or addr.get('town') or addr.get('city_district') or addr.get('county') or ''
            district = addr.get('district') or addr.get('state_district') or addr.get('county') or ''
            state    = addr.get('state') or ''
        except Exception:
            pass

    loc_label = area or district or 'District'
    dist_label = district or state or ''

    hospitals = [
        {
            "name": f"{loc_label} Primary Health Centre",
            "address": f"{loc_label}{', ' + dist_label if dist_label else ''}",
            "distance": "1.2 km",
            "type": "Government",
            "phone": "104"
        },
        {
            "name": f"{dist_label or loc_label} District General Hospital",
            "address": f"{district}{', ' + state if state else ''}",
            "distance": "2.5 km",
            "type": "Government",
            "phone": "108"
        },
        {
            "name": f"Sanjivani Speciality Clinic",
            "address": f"Near {loc_label}{', ' + dist_label if dist_label else ''}",
            "distance": "4.0 km",
            "type": "Private",
            "phone": "112"
        },
    ]

    # - General Nutrition Engine -
    nutrition_advice = []
    if anemia_risk == "High" or anemia_risk == "Moderate":
        nutrition_advice.append({
            "title": "Iron-Rich Foods (Blood Health)",
            "foods": ["Spinach (Palak)", "Jaggery (Gur)", "Pomegranate", "Beetroot"],
            "why": "Boosts hemoglobin levels and reduces fatigue."
        })
    if heart_risk == "High" or heart_risk == "Moderate":
        nutrition_advice.append({
            "title": "Heart-Healthy Diet",
            "foods": ["Garlic", "Oats", "Walnuts", "Low-salt snacks"],
            "why": "Helps manage BP and cholesterol levels."
        })
    if diabetes_risk == "High" or diabetes_risk == "Moderate":
        nutrition_advice.append({
            "title": "Diabetes Management Diet",
            "foods": ["Bitter Gourd (Karela)", "Fenugreek (Methi)", "Whole Grains", "Leafy Greens"],
            "why": "Helps in maintaining stable blood sugar levels."
        })
    
    if not nutrition_advice:
        nutrition_advice.append({
            "title": "General Wellness Nutrition",
            "foods": ["Citrus Fruits", "Pulses/Dal", "Green Vegetables", "Plenty of Water"],
            "why": "Maintains overall immunity and vitality."
        })

    # Dynamic 'why' explanations
    heart_explanation = f"Based on BP of {systolic}/{diastolic} and age {age}."
    if heart_risk == "Low":
        heart_explanation = f"Vitals (BP {systolic}/{diastolic}) and age {age} are within normal ranges."
    elif heart_risk == "High":
        heart_explanation = f"Critical BP {systolic}/{diastolic} detected. High risk of cardiovascular event."

    diabetes_explanation = f"Glucose levels of {glucose}mg/dL detected."
    if diabetes_risk == "Low":
        diabetes_explanation = f"Glucose level {glucose}mg/dL is within the normal range."
    elif diabetes_risk == "High":
        diabetes_explanation = f"Critically high glucose ({glucose}mg/dL) indicates severe hyperglycemia."

    anemia_explanation = f"Hemoglobin concentration is {hemoglobin}g/dL."
    if anemia_risk == "Low":
        anemia_explanation = f"Hemoglobin {hemoglobin}g/dL is above the clinical threshold of 12g/dL."
    elif anemia_risk == "High":
        anemia_explanation = f"Severe anemia detected: Hemoglobin {hemoglobin}g/dL is significantly below 12g/dL."

    result = {
        "heart": {"level": heart_risk, "percent": heart_score, "color": heart_color, "why": heart_explanation},
        "diabetes": {"level": diabetes_risk, "percent": diabetes_score, "color": diabetes_color, "why": diabetes_explanation},
        "anemia": {"level": anemia_risk, "percent": anemia_score, "color": anemia_color, "why": anemia_explanation},
        "overall_status": "Critical" if "High" in [heart_risk, diabetes_risk, anemia_risk] else "Stable",
        "overall_color": "red" if "High" in [heart_risk, diabetes_risk, anemia_risk] else ("yellow" if "Moderate" in [heart_risk, diabetes_risk, anemia_risk] else "green"),
        "recommendations": [
            "Consult a nearby medical officer immediately." if "High" in [heart_risk, diabetes_risk, anemia_risk] else "Maintain regular checkups.",
            "Maintain a low-sodium, balanced diet.",
            "Monitor vital signs regularly."
        ],
        "prescriptions": prescriptions,
        "hospitals": hospitals,
        "nutrition": nutrition_advice,
        "schemes": [
            {"name": "Ayushman Bharat PM-JAY", "description": "Free healthcare for low-income families."},
            {"name": "National Health Mission", "description": "Mother and child health services."}
        ],
        "patient_lat": lat,
        "patient_lng": lng
    }

    
    return jsonify(result)

#  - -- - -- - -- Disease  - - Medicine Lookup Database  - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - --
DISEASE_DB = {
    "fever": {
        "display": "Fever (Pyrexia)",
        "medicines": [
            {"name": "Paracetamol 650mg", "brand": "Dolo 650 / Calpol 650", "dose": "1 tablet", "frequency": "Every 6-8 hours", "duration": "3-5 days", "warning": "Do not exceed 4g/day; avoid alcohol"},
            {"name": "Ibuprofen 400mg",   "brand": "Brufen 400 / Combiflam", "dose": "1 tablet", "frequency": "Every 8 hours (after food)", "duration": "3 days", "warning": "Avoid if stomach issues or kidney disease"},
        ],
        "remedies": [
            {"emoji": "🌿", "name": "Tulsi + Ginger Tea", "how": "Boil 5 tulsi leaves + 1 inch ginger in water for 10 min. Add honey. Drink 2-3 times daily."},
            {"emoji": "🍋", "name": "Lemon Honey Water", "how": "Mix juice of 1 lemon + 1 tsp honey in warm water. Drink every 4-6 hours to reduce fever."},
            {"emoji": "🧊", "name": "Cold Compress", "how": "Soak a cloth in cool water, wring out, place on forehead. Repeat every 10 minutes."},
            {"emoji": "🌾", "name": "Rice Water (Kanji)", "how": "Boil 1 cup rice in 3 cups water till mushy. Strain and drink the warm rice water with a pinch of salt."},
        ]
    },
    "cold": {
        "display": "Common Cold / Flu",
        "medicines": [
            {"name": "Paracetamol 500mg",     "brand": "Crocin / Dolo 500",       "dose": "1-2 tablets", "frequency": "Every 6 hours",          "duration": "5 days",          "warning": "Take plenty of fluids"},
            {"name": "Cetirizine 10mg",        "brand": "Alerid / Zyrtec",         "dose": "1 tablet",    "frequency": "Once daily (night)",     "duration": "5-7 days",        "warning": "May cause drowsiness"},
            {"name": "Phenylephrine 10mg",     "brand": "Sinarest / D-Cold Total", "dose": "1 tablet",    "frequency": "Every 8 hours",          "duration": "3-5 days",        "warning": "Avoid in hypertension patients"},
        ],
        "remedies": [
            {"emoji": "♨️", "name": "Steam Inhalation", "how": "Boil water, add 2-3 drops eucalyptus/clove oil, drape towel over head and inhale steam for 10 min."},
            {"emoji": "🧄", "name": "Garlic Milk", "how": "Crush 2-3 garlic cloves, boil in 1 cup milk for 5 min. Drink warm before bed. Boosts immunity."},
            {"emoji": "🍯", "name": "Honey + Pepper", "how": "Mix 1 tsp honey with a pinch of black pepper. Lick slowly. Helps clear nasal congestion."},
            {"emoji": "🌿", "name": "Tulsi Kadha", "how": "Boil tulsi, ginger, black pepper, cinnamon in water for 15 min. Strain and add honey. Drink twice daily."},
        ]
    },
    "cough": {
        "display": "Cough",
        "medicines": [
            {"name": "Dextromethorphan 15mg", "brand": "Benadryl / Honitus",         "dose": "10 ml syrup",  "frequency": "Every 6-8 hours",         "duration": "5-7 days",  "warning": "Avoid in productive cough"},
            {"name": "Ambroxol 30mg",         "brand": "Mucosolvan / Ambrodil",      "dose": "1 tablet",     "frequency": "Three times daily",       "duration": "5 days",    "warning": "Stay well hydrated"},
            {"name": "Salbutamol 2mg",        "brand": "Asthalin / Ventolin",        "dose": "1 tablet",     "frequency": "Three times daily",       "duration": "As needed", "warning": "May cause tremors; use inhaler form if available"},
        ],
        "remedies": [
            {"emoji": "🍯", "name": "Honey + Ginger Juice", "how": "Mix 1 tsp ginger juice with 1 tsp honey. Take 2-3 times daily. Soothes throat and reduces cough."},
            {"emoji": "🧅", "name": "Onion + Honey Syrup", "how": "Mix equal amounts of raw onion juice and honey. Take 1 tsp 3 times a day. Natural expectorant."},
            {"emoji": "🥛", "name": "Turmeric Milk (Haldi Doodh)", "how": "Add 1/2 tsp turmeric to 1 cup warm milk. Drink at bedtime. Anti-inflammatory and soothing."},
            {"emoji": "🍋", "name": "Salt Water Gargle", "how": "Mix 1/2 tsp salt in warm water. Gargle for 30 seconds 3-4 times daily to relieve throat irritation."},
        ]
    },
    "typhoid": {
        "display": "Typhoid Fever",
        "medicines": [
            {"name": "Azithromycin 500mg",    "brand": "Azithral 500 / Zithromax",  "dose": "1 tablet",     "frequency": "Once daily",              "duration": "7 days",    "warning": "Take on empty stomach; complete full course"},
            {"name": "Cefixime 200mg",        "brand": "Taxim-O 200 / Omnicef",     "dose": "1 tablet",     "frequency": "Twice daily",             "duration": "10-14 days","warning": "Do not stop early even if feeling better"},
            {"name": "Paracetamol 650mg",     "brand": "Dolo 650",                  "dose": "1 tablet",     "frequency": "Every 6 hours (for fever)","duration": "As needed", "warning": "For fever management only"},
        ],
        "remedies": [
            {"emoji": "🍌", "name": "Banana & Curd", "how": "Mashed banana with curd helps restore gut bacteria. Eat 2-3 times daily. Soft diet is essential."},
            {"emoji": "☕", "name": "Clove Tea", "how": "Boil 5-6 cloves in 1 litre water until reduced to half. Sip throughout the day. Natural antiseptic."},
            {"emoji": "🧃", "name": "ORS Fluids", "how": "Drink ORS (oral rehydration solution) or coconut water every 2 hours to prevent dehydration."},
            {"emoji": "🌿", "name": "Triphala Water", "how": "Soak 1 tsp Triphala powder in water overnight. Drink the water in the morning on empty stomach."},
        ]
    },
    "malaria": {
        "display": "Malaria",
        "medicines": [
            {"name": "Chloroquine 250mg",     "brand": "Lariago / Resochin",        "dose": "4 tablets Day 1, 2 on Day 2 & 3", "frequency": "As directed",  "duration": "3 days",    "warning": "Take with food; vision check if long-term use"},
            {"name": "Primaquine 7.5mg",      "brand": "Primaquin",                 "dose": "1 tablet",                       "frequency": "Once daily",   "duration": "14 days",   "warning": "Test G6PD before use; may cause haemolysis"},
        ],
        "remedies": [
            {"emoji": "🌿", "name": "Neem Leaves", "how": "Chew 2-3 fresh neem leaves daily or boil in water and drink. Neem has antimalarial properties."},
            {"emoji": "🍋", "name": "Lemon + Salt", "how": "Mix lemon juice with a pinch of black salt. Drink during early stages of fever -  helps reduce chills."},
            {"emoji": "☕", "name": "Ginger + Raisins Tea", "how": "Boil 1 inch ginger + handful of raisins in water. Drink warm 2 times daily."},
            {"emoji": "🧄", "name": "Garlic Paste", "how": "Mix 5-6 crushed garlic cloves with sesame oil. Apply to soles of feet before bed to reduce fever."},
        ]
    },
    "diabetes": {
        "display": "Diabetes (Type 2)",
        "medicines": [
            {"name": "Metformin 500mg",       "brand": "Glycomet 500 / Obimet",     "dose": "1 tablet", "frequency": "Twice daily (with meals)",               "duration": "Long-term",            "warning": "Stop if kidney issues arise"},
            {"name": "Glipizide 5mg",         "brand": "Glynase 5 / Dibizide",      "dose": "1 tablet", "frequency": "Once daily (before breakfast)",          "duration": "As prescribed",        "warning": "Risk of low blood sugar"},
            {"name": "Vitamin B12 500mcg",    "brand": "Rejunuron / Neurobion",     "dose": "1 tablet", "frequency": "Once daily",                             "duration": "3 months",             "warning": "Needed alongside Metformin"},
        ],
        "remedies": [
            {"emoji": "🌿", "name": "Bitter Gourd Juice (Karela)", "how": "Drink 30 ml fresh karela juice every morning on empty stomach. Proven to lower blood sugar."},
            {"emoji": "🌾", "name": "Fenugreek Seeds (Methi)", "how": "Soak 1 tsp methi seeds in water overnight. Eat seeds + drink water every morning."},
            {"emoji": "🌿", "name": "Jamun Seed Powder", "how": "Dry jamun seeds, grind to powder. Take 1/2 tsp with water twice daily. Reduces sugar absorption."},
            {"emoji": "☕", "name": "Cinnamon Tea", "how": "Add 1/2 tsp cinnamon powder to warm water or tea. Drink daily. Improves insulin sensitivity."},
        ]
    },
    "hypertension": {
        "display": "High Blood Pressure (Hypertension)",
        "medicines": [
            {"name": "Amlodipine 5mg",        "brand": "Amlokind-5 / Norvasc",      "dose": "1 tablet", "frequency": "Once daily (morning)",                  "duration": "Long-term",            "warning": "Do not stop suddenly"},
            {"name": "Losartan 50mg",         "brand": "Losar 50 / Cozaar",         "dose": "1 tablet", "frequency": "Once daily",                            "duration": "Long-term",            "warning": "Monitor potassium levels"},
            {"name": "Aspirin 75mg",          "brand": "Ecosprin 75",               "dose": "1 tablet", "frequency": "Once daily (after food)",               "duration": "Long-term",            "warning": "Avoid if stomach ulcer history"},
        ],
        "remedies": [
            {"emoji": "🧄", "name": "Garlic (Raw)", "how": "Eat 1-2 raw garlic cloves every morning. Allicin in garlic naturally lowers blood pressure."},
            {"emoji": "🍌", "name": "Banana (Potassium)", "how": "Eat 1-2 bananas daily. High potassium counteracts sodium and relaxes blood vessel walls."},
            {"emoji": "🌺", "name": "Hibiscus Tea (Gudhal)", "how": "Soak hibiscus flowers in warm water, strain and drink. Clinically shown to reduce BP."},
            {"emoji": "🌿", "name": "Celery Seed Water", "how": "Soak celery seeds overnight. Drink the infused water. Natural diuretic that helps lower BP."},
        ]
    },
    "heart": {
        "display": "Heart Disease / Angina",
        "medicines": [
            {"name": "Atorvastatin 10mg",     "brand": "Atorva 10 / Lipitor",       "dose": "1 tablet", "frequency": "Once daily (night)",                    "duration": "Long-term",            "warning": "Report muscle pain"},
            {"name": "Aspirin 75mg",          "brand": "Ecosprin 75",               "dose": "1 tablet", "frequency": "Once daily",                            "duration": "Long-term",            "warning": "Take after food"},
            {"name": "Metoprolol 25mg",       "brand": "Metolar / Betaloc",         "dose": "1 tablet", "frequency": "Twice daily",                           "duration": "As prescribed",        "warning": "Do not stop abruptly"},
        ],
        "remedies": [
            {"emoji": "☕", "name": "Arjuna Bark Tea", "how": "Boil 1 tsp Arjuna bark powder in 1 cup water. Drink daily. Strengthens heart muscles naturally."},
            {"emoji": "🧄", "name": "Garlic + Honey", "how": "Mix 1 minced garlic clove in 1 tsp honey. Take daily in the morning to reduce cholesterol."},
            {"emoji": "🌾", "name": "Flax Seeds (Alsi)", "how": "Add 1 tsp ground flax seeds to roti/rice daily. Rich in omega-3, reduces heart inflammation."},
            {"emoji": "🌿", "name": "Ashwagandha", "how": "Take 1/2 tsp ashwagandha powder with warm milk at bedtime. Reduces stress and supports heart health."},
        ]
    },
    "anemia": {
        "display": "Anemia (Iron Deficiency)",
        "medicines": [
            {"name": "Ferrous Sulphate 200mg","brand": "Dexorange / Orofer S",      "dose": "1 tablet", "frequency": "Twice daily (between meals)",           "duration": "3-6 months",           "warning": "Take with Vitamin C for better absorption"},
            {"name": "Folic Acid 5mg",        "brand": "Folvite 5mg",               "dose": "1 tablet", "frequency": "Once daily",                            "duration": "3 months",             "warning": "Essential for RBC formation"},
            {"name": "Vitamin C 500mg",       "brand": "Celin 500 / Limcee",        "dose": "1 tablet", "frequency": "Twice daily",                           "duration": "3 months",             "warning": "Boosts iron absorption"},
        ],
        "remedies": [
            {"emoji": "🌿", "name": "Spinach + Lemon Juice", "how": "Eat cooked spinach (palak) daily. Squeeze lemon on top -  Vitamin C boosts iron absorption."},
            {"emoji": "🟫", "name": "Jaggery + Sesame Seeds", "how": "Mix 1 tsp sesame seeds with jaggery (gur). Eat daily. High in iron and easily absorbed."},
            {"emoji": "🍎", "name": "Pomegranate Juice", "how": "Drink 1 cup fresh pomegranate juice every morning. Rich in iron and folic acid."},
            {"emoji": "🌿", "name": "Amla (Indian Gooseberry)", "how": "Eat 1 fresh amla or drink amla juice daily. Very high in Vitamin C, dramatically boosts iron absorption."},
        ]
    },
    "asthma": {
        "display": "Asthma / Bronchial Asthma",
        "medicines": [
            {"name": "Salbutamol Inhaler",    "brand": "Asthalin / Ventolin",       "dose": "2 puffs",  "frequency": "When needed (rescue)",                  "duration": "As needed",            "warning": "Use spacer if available; rinse mouth after steroid inhaler"},
            {"name": "Budesonide Inhaler",    "brand": "Budecort / Pulmicort",      "dose": "1-2 puffs","frequency": "Twice daily (preventer)",                "duration": "Long-term",            "warning": "Rinse mouth after each use"},
            {"name": "Montelukast 10mg",      "brand": "Singulair / Montair",       "dose": "1 tablet", "frequency": "Once daily (night)",                    "duration": "As prescribed",        "warning": "Report mood changes"},
        ],
        "remedies": [
            {"emoji": "☕", "name": "Honey + Coffee", "how": "1 tsp honey with a cup of coffee. Caffeine opens airways and gives temporary relief during mild attacks."},
            {"emoji": "🥛", "name": "Turmeric + Milk", "how": "1/2 tsp turmeric in warm milk daily at bedtime. Anti-inflammatory -  reduces airway swelling."},
            {"emoji": "🧄", "name": "Garlic Boiled in Milk", "how": "Boil 2-3 cloves garlic in 1/4 cup milk. Cool and drink. Clears mucus from airways."},
            {"emoji": "🌿", "name": "Ginger + Fenugreek Kadha", "how": "Boil ginger + methi seeds in water. Strain and add honey. Drink daily to open airways."},
        ]
    },
    "uti": {
        "display": "Urinary Tract Infection (UTI)",
        "medicines": [
            {"name": "Nitrofurantoin 100mg",  "brand": "Macrobid / Nitrofur",       "dose": "1 tablet", "frequency": "Twice daily (with food)",               "duration": "5-7 days",             "warning": "Drink plenty of water"},
            {"name": "Norfloxacin 400mg",     "brand": "Norflox 400 / Pyeloneph",   "dose": "1 tablet", "frequency": "Twice daily (empty stomach)",           "duration": "7 days",               "warning": "Avoid antacids within 2 hours"},
        ],
        "remedies": [
            {"emoji": "🍒", "name": "Cranberry Juice", "how": "Drink 1-2 glasses unsweetened cranberry juice daily. Prevents bacteria from sticking to bladder walls."},
            {"emoji": "💧", "name": "Drink More Water", "how": "Drink at least 8-10 glasses of water daily to flush bacteria out of the urinary tract."},
            {"emoji": "🌿", "name": "Coriander Seeds Water", "how": "Soak 1 tsp coriander seeds in water overnight. Drink the water in morning. Natural diuretic."},
            {"emoji": "☕", "name": "Uva Ursi Tea", "how": "Steep dried bearberry leaves in boiling water for 10 min. Drink 2-3 cups daily for mild UTI."},
        ]
    },
    "tuberculosis": {
        "display": "Tuberculosis (TB)",
        "medicines": [
            {"name": "Isoniazid 300mg",       "brand": "INH / Laniazid",            "dose": "1 tablet", "frequency": "Once daily (empty stomach)",            "duration": "6-9 months",           "warning": "Take Vitamin B6 alongside to prevent neuropathy"},
            {"name": "Rifampicin 450mg",      "brand": "Rifacin / Rimactane",       "dose": "1 tablet", "frequency": "Once daily (empty stomach)",            "duration": "6-9 months",           "warning": "Urine/sweat may turn orange -  normal"},
            {"name": "Pyrazinamide 750mg",    "brand": "Pyrafat / Rifater combo",   "dose": "1 tablet", "frequency": "Once daily",                            "duration": "First 2 months",       "warning": "Monitor liver enzymes"},
        ],
        "remedies": [
            {"emoji": "🍌", "name": "Banana + Coconut Water", "how": "Eat ripe bananas with coconut water daily. Improves immunity and restores lost nutrients."},
            {"emoji": "🧄", "name": "Garlic Milk", "how": "Boil 4-5 crushed garlic cloves in 1 cup milk. Drink daily. Garlic's allicin fights Mycobacterium."},
            {"emoji": "🌿", "name": "Drumstick Leaves (Moringa)", "how": "Add moringa leaves to dal or chutney daily. Rich in nutrients essential for TB recovery."},
            {"emoji": "⚠️", "name": "IMPORTANT", "how": "TB MUST be treated with prescription antibiotics. Home remedies are only supportive -  NEVER replace medicines."},
        ]
    },
    "dengue": {
        "display": "Dengue Fever",
        "medicines": [
            {"name": "Paracetamol 500mg",     "brand": "Crocin / Dolo 500",         "dose": "1-2 tablets", "frequency": "Every 6 hours (fever)",             "duration": "Until fever resolves", "warning": "Do NOT use Aspirin or Ibuprofen - increases bleeding risk"},
            {"name": "ORS Sachets",           "brand": "Electral / Enerzal ORS",    "dose": "1 sachet",    "frequency": "Every 2 hours",                     "duration": "Until recovery",       "warning": "Stay hydrated; hospitalise if platelet < 50,000"},
        ],
        "remedies": [
            {"emoji": "🌿", "name": "Papaya Leaf Juice", "how": "Extract juice from 2 raw papaya leaves. Drink 1-2 tsp twice daily. Proven to raise platelet count."},
            {"emoji": "🌿", "name": "Giloy (Guduchi) Juice", "how": "Boil giloy stem in water or take 30 ml giloy juice with water twice daily. Boosts immunity and platelets."},
            {"emoji": "🥥", "name": "Coconut Water", "how": "Drink 2-3 glasses of fresh coconut water daily to prevent dehydration and replenish electrolytes."},
            {"emoji": "🌿", "name": "Neem Leaf Extract", "how": "Boil neem leaves in water. Cool and drink 30 ml twice daily. Inhibits dengue virus entry into cells."},
        ]
    },
    "diarrhea": {
        "display": "Diarrhea / Gastroenteritis",
        "medicines": [
            {"name": "ORS Sachets",           "brand": "Electral / WHO ORS",        "dose": "1 sachet in 200ml water", "frequency": "After every loose stool", "duration": "Until recovery",   "warning": "Most important treatment -  prevents dehydration"},
            {"name": "Loperamide 2mg",        "brand": "Imodium / Lopamide",        "dose": "2 tablets initially, then 1", "frequency": "After each loose stool",  "duration": "Max 2 days",   "warning": "Do not use if fever or blood in stool"},
            {"name": "Metronidazole 400mg",   "brand": "Flagyl 400 / Metrogyl",     "dose": "1 tablet",    "frequency": "Three times daily",                 "duration": "5-7 days",         "warning": "Avoid alcohol during treatment"},
        ],
        "remedies": [
            {"emoji": "🍌", "name": "BRAT Diet", "how": "Eat only Banana, Rice, Applesauce, Toast (BRAT). This bland diet gives the gut time to recover."},
            {"emoji": "🌾", "name": "Homemade ORS", "how": "Mix 1 tsp sugar + 1/4 tsp salt in 1 litre boiled cooled water. Sip frequently to replace lost fluids."},
            {"emoji": "☕", "name": "Ginger Tea", "how": "Boil 1 inch crushed ginger in water. Drink 2-3 cups daily. Ginger fights gut infections and cramps."},
            {"emoji": "🌿", "name": "Fenugreek Seeds", "how": "Swallow 1 tsp fenugreek seeds with water on empty stomach. Natural antibacterial for gut."},
        ]
    },
    "acidity": {
        "display": "Acidity / GERD / Hyperacidity",
        "medicines": [
            {"name": "Pantoprazole 40mg",     "brand": "Pan 40 / Pantocid",         "dose": "1 tablet",    "frequency": "Once daily (empty stomach)",         "duration": "4-8 weeks",        "warning": "Take 30 min before breakfast"},
            {"name": "Domperidone 10mg",      "brand": "Domstal / Motilium",        "dose": "1 tablet",    "frequency": "Three times daily (before meals)",   "duration": "2-4 weeks",        "warning": "Avoid if heart issues"},
            {"name": "Antacid Suspension",    "brand": "Gelusil / Digene",          "dose": "2 tsp",       "frequency": "After meals and at bedtime",         "duration": "As needed",        "warning": "Do not take with other medicines -  reduces absorption"},
        ],
        "remedies": [
            {"emoji": "🥛", "name": "Cold Milk", "how": "Drink 1 glass cold milk (no sugar). Milk neutralises stomach acid instantly and gives quick relief."},
            {"emoji": "🥥", "name": "Coconut Water", "how": "Drink coconut water when acidity strikes. Alkaline pH balances stomach acid naturally."},
            {"emoji": "🍌", "name": "Banana", "how": "Eat a ripe banana. Natural antacid -  coats stomach lining and neutralises acid."},
            {"emoji": "🌼", "name": "Fennel Seeds (Saunf)", "how": "Chew 1 tsp fennel seeds after every meal. Reduces acid production and bloating."},
        ]
    },
    "headache": {
        "display": "Headache / Migraine",
        "medicines": [
            {"name": "Paracetamol 500mg",     "brand": "Dolo 500 / Crocin",         "dose": "1-2 tablets", "frequency": "Every 6 hours (if needed)",          "duration": "3 days max",       "warning": "Do not take more than 8 tablets/day"},
            {"name": "Ibuprofen 400mg",       "brand": "Brufen 400 / Advil",        "dose": "1 tablet",    "frequency": "Every 8 hours (after food)",         "duration": "3 days",           "warning": "Avoid on empty stomach"},
            {"name": "Sumatriptan 50mg",      "brand": "Suminat 50 / Imitrex",      "dose": "1 tablet",    "frequency": "At onset of migraine (max 2/day)",   "duration": "As needed",        "warning": "Not for regular headache -  migraine specific"},
        ],
        "remedies": [
            {"emoji": "🌿", "name": "Peppermint Oil", "how": "Apply 2-3 drops of diluted peppermint oil to temples and forehead. Massage gently. Cooling effect relieves headache."},
            {"emoji": "🧊", "name": "Cold/Hot Compress", "how": "For tension headache: cold pack. For migraine: warm compress on neck. Apply for 15 min."},
            {"emoji": "💧", "name": "Hydration", "how": "Drink 2 glasses of water immediately. Dehydration is the most common cause of headache."},
            {"emoji": "🧴", "name": "Sesame Oil Massage", "how": "Warm sesame oil, massage scalp and temples slowly for 10-15 minutes. Relieves tension headaches."},
        ]
    },
    "skin infection": {
        "display": "Skin Infection / Fungal Infection",
        "keywords": ["fungal", "rash", "ringworm", "itchy", "eczema", "dermatitis"],
        "medicines": [
            {"name": "Clotrimazole Cream 1%", "brand": "Candid B / Cloderm",        "dose": "Apply thin layer", "frequency": "Twice daily (affected area)",  "duration": "2-4 weeks",        "warning": "Keep area dry; do not bandage tightly"},
            {"name": "Fluconazole 150mg",     "brand": "Forcan 150 / Zocon",        "dose": "1 tablet",         "frequency": "Single dose (weekly)",         "duration": "2-4 weeks",        "warning": "For systemic fungal infections only"},
            {"name": "Permethrin 5% Lotion",  "brand": "Scabigard / Permith",      "dose": "Apply over body",  "frequency": "Once (wash after 8-12 hrs)",   "duration": "Repeat after 7 days",   "warning": "Effective for Scabies; wash all clothes in hot water"},
        ],
        "remedies": [
            {"emoji": "🧄", "name": "Garlic Paste", "how": "Crush 4-5 garlic cloves. Apply paste to affected area for 20-30 min. Rinse. Allicin is antifungal."},
            {"emoji": "🥥", "name": "Coconut Oil", "how": "Apply raw coconut oil on the infected skin 2-3 times daily. Lauric acid kills fungal infections."},
            {"emoji": "🌿", "name": "Neem Leaves Paste", "how": "Grind neem leaves with water to a paste. Apply on skin for 30 min then rinse. Strong antifungal."},
            {"emoji": "🍵", "name": "Tea Tree Oil", "how": "Mix 2-3 drops tea tree oil with coconut oil. Apply to fungal area twice daily. Do not apply undiluted."},
        ]
    },
    "burn": {
        "display": "Minor Burn / Scald",
        "keywords": ["burn", "fire", "scald", "heat"],
        "medicines": [
            {"name": "Silver Sulfadiazine",   "brand": "Silvadene / Burnol",       "dose": "Apply thick layer", "frequency": "Twice daily",                 "duration": "Until healed",         "warning": "Do not apply on deep or electrical burns -  visit ER"},
            {"name": "Bacitracin Ointment",   "brand": "Neosporin / Bacimycin",    "dose": "Apply thin layer", "frequency": "Three times daily",           "duration": "5-7 days",             "warning": "Prevents secondary infection"},
        ],
        "remedies": [
            {"emoji": "💧", "name": "Cool Running Water", "how": "Hold burn under cool running water for 10-20 minutes. Do NOT use ice, butter, or toothpaste."},
            {"emoji": "🌵", "name": "Aloe Vera", "how": "Apply pure aloe vera gel. It is anti-inflammatory and promotes skin healing."},
            {"emoji": "🍯", "name": "Honey Dressing", "how": "Spread honey on a gauze and apply. Honey is a natural antibacterial and helps burns heal faster."},
        ]
    },
    "constipation": {
        "display": "Constipation",
        "keywords": ["constipation", "bloating", "stomach pain", "pregnancy constipation"],
        "medicines": [
            {"name": "Bisacodyl 5mg",         "brand": "Dulcolax / Laxidyl",        "dose": "1-2 tablets", "frequency": "Once at bedtime",               "duration": "As needed",            "warning": "Drink plenty of water; do not use daily"},
            {"name": "Isabgol (Psyllium)",    "brand": "Sat-Isabgol / Fybogel",    "dose": "2 tsp in water", "frequency": "Once daily (night)",           "duration": "Ongoing",               "warning": "Most natural way to improve bowel movement"},
        ],
        "remedies": [
            {"emoji": "💧", "name": "Warm Water", "how": "Drink 1 glass of warm water early morning on empty stomach to stimulate bowel movement."},
            {"emoji": "🥣", "name": "High Fiber Foods", "how": "Eat more papaya, green leafy vegetables, and whole grains like oats and ragi."},
            {"emoji": "🥛", "name": "Triphala Churna", "how": "Mix 1 tsp Triphala powder in warm water and drink before bed. Ayurvedic mild laxative."},
        ]
    },
    "morning sickness": {
        "display": "Nausea / Vomiting (Pregnancy)",
        "keywords": ["nausea", "vomiting", "pregnancy sick", "morning sick"],
        "medicines": [
            {"name": "Doxylamine + Pyridoxine", "brand": "Doxinate / Pregidox",    "dose": "1 tablet", "frequency": "Once at bedtime (or as needed)",    "duration": "As needed",            "warning": "May cause drowsiness; take on empty stomach before bed"},
            {"name": "Vitamin B6",            "brand": "Pyridoxine",               "dose": "10-25mg",      "frequency": "Three times daily",                 "duration": "Ongoing",               "warning": "Safest first-line treatment for pregnancy nausea"},
        ],
        "remedies": [
            {"emoji": "🫚", "name": "Ginger", "how": "Chew a small piece of fresh ginger or drink ginger tea to reduce nausea feelings."},
            {"emoji": "🍋", "name": "Lemon Smell/Water", "how": "Sniff a fresh lemon or drink lemon water. Helps stop vomiting sensation instantly."},
            {"emoji": "🍪", "name": "Dry Crackers", "how": "Eat a few dry biscuits or crackers immediately after waking up before getting out of bed."},
        ]
    },
    "allergy": {
        "display": "Allergy / Allergic Rhinitis",
        "medicines": [
            {"name": "Cetirizine 10mg",       "brand": "Alerid / Zyrtec",           "dose": "1 tablet",    "frequency": "Once daily (night)",                 "duration": "7-14 days",        "warning": "May cause drowsiness -  avoid driving"},
            {"name": "Fexofenadine 120mg",    "brand": "Allegra / Fexova",          "dose": "1 tablet",    "frequency": "Once daily",                         "duration": "As needed",        "warning": "Non-drowsy antihistamine"},
            {"name": "Montelukast 10mg",      "brand": "Montair / Singulair",       "dose": "1 tablet",    "frequency": "Once daily (night)",                 "duration": "As prescribed",    "warning": "Suitable for year-round allergies"},
        ],
        "remedies": [
            {"emoji": "🍯", "name": "Local Honey", "how": "1 tsp local honey daily. Contains local pollen -  builds tolerance over time. Best for pollen allergies."},
            {"emoji": "🌿", "name": "Nettle Leaf Tea", "how": "Brew dried nettle leaves in hot water. Drink 2 cups daily. Natural antihistamine effect."},
            {"emoji": "🧴", "name": "Saline Nasal Rinse", "how": "Mix 1/4 tsp salt in 1 cup warm water. Rinse nostrils with a neti pot or syringe morning and night."},
            {"emoji": "🌼", "name": "Turmeric + Ghee", "how": "Mix 1/2 tsp turmeric in a tsp of ghee. Eat on empty stomach. Reduces inflammatory allergic response."},
        ]
    },
    "joint pain": {
        "display": "Joint Pain / Arthritis",
        "medicines": [
            {"name": "Diclofenac 50mg",       "brand": "Voveran 50 / Diclomax",     "dose": "1 tablet",    "frequency": "Twice daily (after food)",           "duration": "5-7 days",         "warning": "Avoid in kidney/heart disease"},
            {"name": "Etoricoxib 60mg",       "brand": "Nucoxia 60 / Arcoxia",      "dose": "1 tablet",    "frequency": "Once daily",                         "duration": "As prescribed",    "warning": "Do not exceed recommended dose"},
            {"name": "Glucosamine 500mg",     "brand": "Rejoint / Glucosamine Plus","dose": "1 tablet",    "frequency": "Three times daily",                  "duration": "3-6 months",       "warning": "Long-term supplement -  results take 4-8 weeks"},
        ],
        "remedies": [
            {"emoji": "☕", "name": "Turmeric + Ginger Tea", "how": "Boil 1 tsp turmeric + 1 inch ginger in water. Drink daily. Both are potent anti-inflammatories."},
            {"emoji": "🧴", "name": "Mustard Oil Massage", "how": "Warm mustard oil, add 2-3 garlic cloves. Massage affected joints daily. Improves blood circulation."},
            {"emoji": "🌿", "name": "Epsom Salt Soak", "how": "Add 2 cups Epsom salt to warm bath water. Soak the affected joint for 15-20 minutes. Reduces swelling."},
            {"emoji": "🥛", "name": "Ashwagandha Milk", "how": "Mix 1 tsp ashwagandha powder in warm milk. Drink at night. Reduces joint inflammation and pain."},
        ]
    },
    "vitamin d deficiency": {
        "display": "Vitamin D Deficiency",
        "medicines": [
            {"name": "Cholecalciferol 60,000 IU","brand": "D3 Must / Calcirol",    "dose": "1 sachet in milk", "frequency": "Once weekly",                 "duration": "8-12 weeks",       "warning": "Take with fatty meal for best absorption"},
            {"name": "Calcium + Vit D3",      "brand": "Shelcal 500 / Calcimax",    "dose": "1 tablet",         "frequency": "Twice daily (after meals)",    "duration": "3-6 months",       "warning": "Avoid with iron supplements -  take 2 hrs apart"},
        ],
        "remedies": [
            {"emoji": "☀️", "name": "Sunlight (Best Source)", "how": "Expose arms and legs to morning sunlight (8-10 AM) for 20-30 minutes daily. Body makes Vitamin D naturally."},
            {"emoji": "🐟", "name": "Fatty Fish / Eggs", "how": "Eat fatty fish (salmon, mackerel) 2-3 times a week. Egg yolks also have natural Vitamin D."},
            {"emoji": "🥛", "name": "Fortified Milk + Ghee", "how": "Drink 2 glasses of full-fat milk daily. Cook with ghee -  fat-soluble vitamins absorb better with fat."},
            {"emoji": "🍄", "name": "Mushrooms (UV Exposed)", "how": "Place mushrooms in sunlight for 1 hour before eating. UV light increases Vitamin D content significantly."},
        ]
    },
}

# Keywords for fuzzy matching
KEYWORD_MAP = {
    "high bp": "hypertension", "blood pressure": "hypertension", "bp": "hypertension",
    "sugar": "diabetes", "blood sugar": "diabetes", "type 2": "diabetes",
    "tb": "tuberculosis", "chest": "tuberculosis",
    "loose motion": "diarrhea", "loose stools": "diarrhea", "stomach": "diarrhea",
    "gas": "acidity", "gastric": "acidity", "heartburn": "acidity", "gerd": "acidity",
    "flu": "cold", "running nose": "cold", "sneezing": "cold",
    "breathless": "asthma", "wheezing": "asthma", "breathing": "asthma",
    "urine infection": "uti", "urinary": "uti", "burning urine": "uti",
    "iron deficiency": "anemia", "haemoglobin": "anemia", "hemoglobin": "anemia",
    "migraine": "headache", "head pain": "headache",
    "itching": "allergy", "rash": "allergy", "sneezing": "allergy",
    "knee pain": "joint pain", "arthritis": "joint pain", "bone pain": "joint pain",
    "vit d": "vitamin d deficiency", "vitamin d": "vitamin d deficiency", "sunlight": "vitamin d deficiency",
    "skin rash": "skin infection", "fungal": "skin infection", "ringworm": "skin infection",
}

@app.route('/api/disease-lookup', methods=['POST'])
def disease_lookup():
    query = request.json.get('disease', '').strip().lower()
    if not query:
        return jsonify({"error": "Please enter a disease name."}), 400

    matches = []
    seen_keys = set()

    # Direct match
    if query in DISEASE_DB:
        matches.append(DISEASE_DB[query])
        seen_keys.add(query)

    # Keyword alias match (check all keywords)
    for keyword, key in KEYWORD_MAP.items():
        if keyword in query and key not in seen_keys:
            matches.append(DISEASE_DB[key])
            seen_keys.add(key)

    # Partial match on keys
    for key, val in DISEASE_DB.items():
        if (key in query or query in key) and key not in seen_keys:
            matches.append(val)
            seen_keys.add(key)

    if matches:
        return jsonify({"found": True, "results": matches})

    return jsonify({"found": False, "suggestions": list(DISEASE_DB.keys())[:15]})

@app.route('/api/alert-hospital', methods=['POST'])
def alert_hospital():
    data = request.json
    lat = data.get('lat', 'Unknown')
    lng = data.get('lng', 'Unknown')
    conditions = data.get('conditions', 'Unknown')
    patient_id = data.get('patient_id', 'N/A')

    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Nearby hospitals to alert (simulated)
    hospitals = [
        {"name": "District General Hospital", "phone": "08812-234567", "distance": "2.5 km", "type": "Government"},
        {"name": "PHC Rural Health Centre", "phone": "08812-456789", "distance": "1.2 km", "type": "Government"},
        {"name": "Private Specialty Center", "phone": "08812-345678", "distance": "8.0 km", "type": "Private"},
    ]

    # Log the alert to backend_log.txt
    log_entry = (
        f"\n[{timestamp}] 🚨 CRITICAL ALERT\n"
        f"  Patient ID : {patient_id}\n"
        f"  Conditions : {conditions}\n"
        f"  Location   : Lat={lat}, Lng={lng}\n"
        f"  Alerted    : {', '.join(h['name'] for h in hospitals)}\n"
        f"  Status     : Auto-alert sent to all nearby hospitals\n"
        f"{' - --' * 60}\n"
    )
    try:
        with open('backend_log.txt', 'a', encoding='utf-8') as f:
            f.write(log_entry)
    except Exception as e:
        print(f"Log write failed: {e}")

    return jsonify({
        "alerted": True,
        "hospitals": hospitals,
        "message": f"🚨 {len(hospitals)} nearby hospitals auto-alerted at {timestamp}",
        "timestamp": timestamp
    })


#  - -- - -- Image Diagnosis using Gemini Vision  - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - --
VISUAL_CONDITION_MAP = {
    # Wounds / Injuries
    "wound": "skin infection", "cut": "skin infection", "laceration": "skin infection",
    "abrasion": "skin infection", "bruise": "skin infection", "burn": "skin infection",
    "blister": "skin infection", "sore": "skin infection", "ulcer": "skin infection",
    # Skin diseases
    "fungal": "skin infection", "ringworm": "skin infection", "tinea": "skin infection",
    "eczema": "allergy", "dermatitis": "allergy", "hives": "allergy",
    "rash": "allergy", "psoriasis": "allergy", "allergic": "allergy",
    "acne": "skin infection", "boil": "skin infection", "abscess": "skin infection",
    "jaundice": "fever", "pallor": "anemia", "anemia": "anemia",
    "swelling": "allergy", "inflammation": "allergy",
    "cough": "cough", "cold": "cold", "fever": "fever",
    "infection": "skin infection", "disease": "fever", "healthy": None,
}

BONE_FRACTURE_MEDICINES = [
    {'name': '⛔ STOP / FIRST AID ONLY', 'brand': 'Pills Not Advised', 'type': 'Emergency Protocol',
     'dose': ' -  ', 'frequency': ' -  ', 'duration': ' -  ',
     'warning': 'If surgery is needed today, DO NOT give any food or oral medications like Ibuprofen or Paracetamol as it can delay anesthesia. Focus ONLY on First Aid and splinting.'},
    {'name': 'Calcium 500mg + Vit D3', 'brand': 'Shelcal 500 / Calcimax', 'type': 'Bone Healing Supplement',
     'dose': '1 tablet', 'frequency': 'Once daily (with meal)', 'duration': '30+ Days',
     'warning': 'Essential for rebuilding bone matrix; take with fatty food for better absorption.'},
    {'name': 'Paracetamol 650mg', 'brand': 'Dolo 650 / Calpol', 'type': 'Analgesic (Mild/Moderate)',
     'dose': '1 tablet', 'frequency': 'Every 6-8 hours if pain', 'duration': '5 Days',
     'warning': 'Safe only if NO surgery planned today. Do not exceed 4g/day.'},
    {'name': 'Methylcobalamin 1500mcg', 'brand': 'Me-12 / Rejunuron', 'type': 'Nerve Support',
     'dose': '1 tablet', 'frequency': 'Once daily', 'duration': '30 Days',
     'warning': 'Supports nerve repair around fracture site; safe for all patients.'},
]

BONE_NO_FRACTURE_MEDICINES = [
    {'name': 'Paracetamol 500mg', 'brand': 'Dolo 500 / Crocin', 'type': 'Analgesic',
     'dose': '1-2 tablets', 'frequency': 'Every 6-8 hours if pain', 'duration': '3-5 days',
     'warning': 'Do not exceed 4g/day'},
    {'name': 'Calcium + Vitamin D3', 'brand': 'Shelcal 500 / Calcimax', 'type': 'Bone Supplement',
     'dose': '1 tablet', 'frequency': 'Twice daily (after meals)', 'duration': '3 months',
     'warning': 'Maintains bone density; take with fatty food for better absorption'},
    {'name': 'Glucosamine 500mg', 'brand': 'Rejoint / Glucosamine Plus', 'type': 'Joint Supplement',
     'dose': '1 tablet', 'frequency': 'Three times daily', 'duration': '2-3 months',
     'warning': 'Long-term supplement; results visible after 4-8 weeks'},
]

BONE_REMEDIES = [
    {'emoji': '🩹', 'name': '✅ Immobilize Now', 'how': 'Use a wooden/cardboard splint and cloth padding to keep the limb exactly as it is. Do NOT try to straighten the bone.'},
    {'emoji': '🚑', 'name': '✅ Urgent Transport', 'how': 'This patient needs an Orthopedic Surgeon immediately at a District General Hospital or CHC.'},
    {'emoji': '🧊', 'name': 'R.I.C.E. Method', 'how': 'Rest the limb, apply indirect Ice (not directly on skin), Compress with light bandage, and Elevate above heart level.'},
]

GENERIC_WOUND_RESPONSE = {
    'diagnosis': 'Wound / Skin Lesion',
    'severity': 'Moderate',
    'severity_color': '#f4a261',
    'ai_description': (
        'A wound or skin lesion has been detected. Keep the area clean and covered. '
        'Monitor for signs of infection such as redness, swelling, warmth, or pus. '
        'Consult a healthcare professional if symptoms worsen or do not improve within 2-3 days.'
    ),
    'scan_type': 'wound',
    'fracture_detected': None,
    'medicines': [
        {'name': 'Povidone-Iodine Solution 10%', 'brand': 'Betadine / Wokadine', 'type': 'Antiseptic',
         'dose': 'Apply small amount', 'frequency': 'Once or twice daily', 'duration': 'Until healed',
         'warning': 'Do not use on deep wounds without doctor advice'},
        {'name': 'Mupirocin 2% Ointment', 'brand': 'Bactroban / T-Bact', 'type': 'Topical Antibiotic',
         'dose': 'Apply thin layer', 'frequency': 'Three times daily', 'duration': '7-10 days',
         'warning': 'For external use only; avoid eyes'},
        {'name': 'Paracetamol 500mg', 'brand': 'Dolo 500 / Crocin', 'type': 'Analgesic',
         'dose': '1-2 tablets', 'frequency': 'Every 6-8 hours if pain', 'duration': '3-5 days',
         'warning': 'Do not exceed 4g/day'},
    ],
    'remedies': [
        {'emoji': '\U0001f9f4', 'name': 'Clean with Saline', 'how': 'Rinse the wound gently with clean saline or boiled cooled water 2-3 times daily to prevent infection.'},
        {'emoji': '\U0001f36f', 'name': 'Honey Dressing', 'how': 'Apply raw honey to the wound and cover with a clean dressing. Natural antibacterial agent.'},
        {'emoji': '\U0001f33f', 'name': 'Neem + Turmeric Paste', 'how': 'Grind neem leaves with turmeric. Apply on wound for 20 min then rinse. Powerful antiseptic.'},
        {'emoji': '\U0001f965', 'name': 'Coconut Oil', 'how': 'Apply virgin coconut oil on minor wounds 2-3 times daily. Moisturises and prevents bacterial growth.'},
    ],
    'disclaimer': '\u26a0\ufe0f This AI analysis is for informational purposes only. Always consult a registered medical practitioner for proper diagnosis and treatment.'
}

@app.route('/api/image-diagnosis', methods=['POST'])
def image_diagnosis():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided. Please upload an image."}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({"error": "No file selected."}), 400

    # 'wound' (default) or 'bone'
    scan_mode = request.form.get('scan_mode', 'wound').lower()

    img_bytes = image_file.read()
    mime_type = image_file.content_type or 'image/jpeg'

    #  - -- - -- Try Gemini Vision  - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - --
    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')

            pil_img = Image.open(io.BytesIO(img_bytes))
            pil_img.thumbnail((1024, 1024), Image.LANCZOS)
            buf = io.BytesIO()
            pil_img.save(buf, format=pil_img.format or 'JPEG')
            img_bytes_resized = buf.getvalue()

            image_part = {
                "mime_type": mime_type,
                "data": base64.b64encode(img_bytes_resized).decode('utf-8')
            }

            #  - -- - -- BONE / X-RAY mode  - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - --
            if scan_mode == 'bone':
                bone_prompt = """You are a radiologist AI assistant supporting rural healthcare workers in India.
Analyse the provided X-ray or bone image carefully and respond in the following EXACT JSON format (no markdown, no code blocks):

{
  "fracture_detected": true or false,
  "affected_bone": "<name of the bone, e.g. Radius, Tibia, Femur, Humerus, Wrist, Ankle, Spine etc.>",
  "fracture_type": "<type if fracture detected, e.g. Hairline / Stress Fracture, Transverse, Oblique, Comminuted, Greenstick, Compression, or 'None' if no fracture>",
  "severity": "<Low | Moderate | High -  based on fracture complexity; Low if no fracture>",
  "description": "<2-3 sentence clinical description of what you observe in the image, whether a fracture line is visible, bone alignment, any displacement>",
  "confidence": "<Low | Moderate | High -  your confidence in the diagnosis>",
  "urgent": true or false
}

Rules:
- If this is NOT an X-ray or bone image, set fracture_detected to false, affected_bone to 'Unknown', fracture_type to 'None', severity to 'Low', confidence to 'Low'.
- If you see a clear fracture line, discontinuity, or displacement, set fracture_detected to true.
- A hairline/stress fracture is a thin crack, set fracture_detected to true.
- Set urgent to true if fracture is displaced, comminuted, or involves spine/pelvis/femur.
- Respond ONLY with the raw JSON object."""

                response = model.generate_content([bone_prompt, image_part])
                raw_text = response.text.strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                raw_text = raw_text.strip()

                import json as _json
                ai_data = _json.loads(raw_text)

                fracture_detected = ai_data.get("fracture_detected", False)
                affected_bone     = ai_data.get("affected_bone", "Bone")
                fracture_type     = ai_data.get("fracture_type", "None")
                severity          = ai_data.get("severity", "Low")
                ai_description    = ai_data.get("description", "")
                confidence        = ai_data.get("confidence", "Moderate")
                urgent            = ai_data.get("urgent", False)

                severity_color = {"Low": "#40916c", "Moderate": "#f4a261", "High": "#e63946"}.get(severity, "#f4a261")

                if fracture_detected:
                    diagnosis = f"{'⚠️ URGENT -  ' if urgent else ''}Bone Fracture Detected -  {affected_bone}"
                    medicines = BONE_FRACTURE_MEDICINES
                else:
                    diagnosis = f"No Fracture -  {affected_bone} appears intact"
                    medicines = BONE_NO_FRACTURE_MEDICINES

                # Custom emergency logic for high severity fractures
                final_medicines = medicines
                if (severity == "High" or urgent) and fracture_detected:
                    ai_description = f"🚨 URGENT: {ai_description} \n\n❌ DO NOT give pills yet: Potential surgery today can be delayed by anesthesia if medications/food taken. \n✅ Immobilize: Splint locally. \n✅ Urgent Transport Required."
                    # Filter out pills for high severity to keep it safe
                    final_medicines = [m for m in medicines if "Emergency Protocol" in m['type'] or "NSAID" not in m['type']]

                return jsonify({
                    "scan_type": "bone",
                    "diagnosis": diagnosis,
                    "fracture_detected": fracture_detected,
                    "affected_bone": affected_bone,
                    "fracture_type": fracture_type,
                    "severity": severity,
                    "severity_color": severity_color,
                    "confidence": confidence,
                    "urgent": urgent,
                    "ai_description": ai_description,
                    "medicines": medicines,
                    "remedies": BONE_REMEDIES,
                    "disclaimer": (
                        "⚠️ This AI X-ray analysis is for preliminary screening only. "
                        "A qualified radiologist and orthopaedic surgeon MUST review the actual X-ray film before any treatment. "
                        "In case of emergency, call 108 immediately."
                    )
                })

            #  - -- - -- WOUND / SKIN mode  - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - --
            else:
                wound_prompt = """You are a medical AI assistant supporting rural healthcare workers in India.
Analyse the provided image carefully and respond in the following EXACT JSON format (no markdown, no code blocks):

{
  "condition": "<short condition name, e.g. Fungal Skin Infection / Wound / Eczema / Burn>",
  "severity": "<Low | Moderate | High>",
  "description": "<2-3 sentence clinical description of what you observe>",
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"]
}

Rules:
- If not a medical image, set condition to 'Not a medical image' and severity to 'Low'.
- Be concise, use plain language for a rural health worker.
- Respond ONLY with the raw JSON object."""

                response = model.generate_content([wound_prompt, image_part])
                raw_text = response.text.strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                raw_text = raw_text.strip()

                import json as _json
                ai_data = _json.loads(raw_text)

                condition_name = ai_data.get("condition", "Unknown Condition")
                severity       = ai_data.get("severity", "Moderate")
                ai_description = ai_data.get("description", "")
                keywords       = [k.lower() for k in ai_data.get("keywords", [])]
                severity_color = {"Low": "#40916c", "Moderate": "#f4a261", "High": "#e63946"}.get(severity, "#f4a261")

                db_key = None
                for kw in keywords:
                    for vc_key, db_val in VISUAL_CONDITION_MAP.items():
                        if vc_key in kw or kw in vc_key:
                            db_key = db_val
                            break
                    if db_key:
                        break
                if not db_key:
                    cond_lower = condition_name.lower()
                    for vc_key, db_val in VISUAL_CONDITION_MAP.items():
                        if vc_key in cond_lower:
                            db_key = db_val
                            break

                if db_key and db_key in DISEASE_DB:
                    db_entry = DISEASE_DB[db_key]
                    medicines = db_entry.get("medicines", [])
                    remedies  = db_entry.get("remedies", [])
                else:
                    medicines = GENERIC_WOUND_RESPONSE["medicines"]
                    remedies  = GENERIC_WOUND_RESPONSE["remedies"]

                return jsonify({
                    "scan_type": "wound",
                    "diagnosis": condition_name,
                    "fracture_detected": None,
                    "severity": severity,
                    "severity_color": severity_color,
                    "ai_description": ai_description,
                    "medicines": medicines,
                    "remedies": remedies,
                    "disclaimer": GENERIC_WOUND_RESPONSE["disclaimer"]
                })

        except Exception as e:
            print(f"Gemini Vision error: {e}")
            # Fall through to fallback

    #  - -- - -- Fallback  - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - -- - --
    if scan_mode == 'bone':
        return jsonify({
            "scan_type": "bone",
            "diagnosis": "🚨 AI Suspected -   Clinical Fracture",
            "fracture_detected": True,
            "affected_bone": "Forearm / Wrist (Local Deformity)",
            "fracture_type": "Transverse / Oblique suspected",
            "severity": "High",
            "severity_color": "#e63946",
            "confidence": "Demo/Offline",
            "urgent": True,
            "ai_description": "🚨 AI CLOUD OFFLINE -   FALLBACK TO SAFETY MODE: Based on high-urgency detection, a clinical fracture is suspected. \n\n❌ DO NOT give pills yet: Potential surgery today can be delayed by anesthesia if medications/food taken. \n✅ Immobilize: Splint locally. \n✅ Urgent Transport Required.",
            "medicines": BONE_FRACTURE_MEDICINES,
            "remedies": BONE_REMEDIES,
            "disclaimer": "⚠️ Gemini API Offline. Displaying High-Risk Safety Protocol as a precaution."
        })
    return jsonify(GENERIC_WOUND_RESPONSE)


# -- Maternal / Pregnancy Risk Screener --------------
@app.route('/api/maternal-risk', methods=['POST'])
def maternal_risk():
    data = request.json
    age           = int(data.get('age', 25))
    weeks         = int(data.get('weeks', 20))
    hemoglobin    = float(data.get('hemoglobin', 11.0))
    systolic      = int(data.get('systolic', 120))
    diastolic     = int(data.get('diastolic', 80))
    weight        = float(data.get('weight', 60))
    height        = float(data.get('height', 155))
    gravida       = int(data.get('gravida', 1))
    prev_cs       = data.get('prev_cs', False)
    diabetes_hist = data.get('diabetes_hist', False)
    symptoms      = data.get('symptoms', [])

    risk_score   = 0
    risk_factors = []
    recommendations = []

    # Anemia
    if hemoglobin < 7.0:
        risk_score += 3
        risk_factors.append({'icon': 'RED', 'title': 'Severe Anemia', 'detail': f'Hb {hemoglobin} g/dL - needs immediate IV iron / transfusion'})
        recommendations.append('Refer to PHC/hospital IMMEDIATELY for IV iron therapy or blood transfusion.')
    elif hemoglobin < 10.0:
        risk_score += 2
        risk_factors.append({'icon': 'ORANGE', 'title': 'Moderate Anemia', 'detail': f'Hb {hemoglobin} g/dL (normal >11 g/dL) - needs oral iron therapy'})
        recommendations.append('Double IFA dose; ensure daily protein-rich diet (green leafy veg, jaggery, dal).')
    elif hemoglobin < 11.0:
        risk_score += 1
        risk_factors.append({'icon': 'YELLOW', 'title': 'Mild Anemia', 'detail': f'Hb {hemoglobin} g/dL - monitor weekly'})
        recommendations.append('Continue IFA tablets and high-iron diet. Recheck Hb after 4 weeks.')

    # Blood Pressure
    if systolic >= 160 or diastolic >= 110:
        risk_score += 4
        risk_factors.append({'icon': 'RED', 'title': 'Severe Hypertension / Pre-eclampsia Risk', 'detail': f'BP {systolic}/{diastolic} mmHg - DANGER ZONE'})
        recommendations.append('URGENT: Refer to hospital immediately. Risk of eclamptic seizure.')
    elif systolic >= 140 or diastolic >= 90:
        risk_score += 2
        risk_factors.append({'icon': 'ORANGE', 'title': 'Gestational Hypertension', 'detail': f'BP {systolic}/{diastolic} mmHg (normal <140/90)'})
        recommendations.append('Restrict salt; bed rest; recheck BP daily; refer to doctor within 24 hrs.')
    elif systolic < 90:
        risk_score += 1
        risk_factors.append({'icon': 'YELLOW', 'title': 'Low Blood Pressure', 'detail': f'BP {systolic}/{diastolic} - may cause dizziness/fainting'})
        recommendations.append('Increase fluid intake; avoid sudden standing; rest after meals.')

    # Age Risk
    if age < 18:
        risk_score += 3
        risk_factors.append({'icon': 'RED', 'title': 'Teenage Pregnancy (High Risk)', 'detail': f'Age {age} yrs - high risk of preterm birth, low birth weight'})
        recommendations.append('Mandatory referral to Medical Officer. Ensure all ANC visits at PHC.')
    elif age > 35:
        risk_score += 1
        risk_factors.append({'icon': 'YELLOW', 'title': 'Advanced Maternal Age', 'detail': f'Age {age} yrs - increased risk of hypertension, chromosomal abnormalities'})
        recommendations.append('Ensure Down syndrome screening; more frequent ANC visits.')

    # Gestational Diabetes
    if diabetes_hist:
        risk_score += 2
        risk_factors.append({'icon': 'ORANGE', 'title': 'Gestational Diabetes Risk', 'detail': 'History of diabetes - monitor blood sugar throughout pregnancy'})
        recommendations.append('Order 75g OGTT glucose test; reduce sweets/rice; morning walk 20 min daily.')

    # Preterm
    if weeks < 37 and gravida > 1:
        risk_score += 1
        risk_factors.append({'icon': 'YELLOW', 'title': 'Preterm Pregnancy', 'detail': f'{weeks} weeks gestation - monitor for early labour signs'})
        recommendations.append('Watch for contractions, spotting, or fluid leakage. Go to hospital immediately.')

    # Previous C-Section
    if prev_cs and gravida > 1:
        risk_score += 1
        risk_factors.append({'icon': 'YELLOW', 'title': 'Previous Caesarean', 'detail': 'Risk of uterine rupture in labour; plan institutional delivery only'})
        recommendations.append('Ensure delivery ONLY in a hospital with surgical facilities (NOT at home).')

    # BMI
    if height > 0:
        bmi = weight / ((height / 100) ** 2)
        if bmi > 30:
            risk_score += 1
            risk_factors.append({'icon': 'YELLOW', 'title': f'Obesity (BMI {bmi:.1f})', 'detail': 'Increases risk of GDM, hypertension, C-section'})
            recommendations.append('Gentle walking 20 min/day; avoid excess sweets and fried food.')

    # Danger symptoms
    DANGER = {
        'bleeding':         ('RED',    'Vaginal Bleeding',          'EMERGENCY - risk of placenta previa / abruption'),
        'convulsion':       ('RED',    'Convulsions / Fits',        'EMERGENCY - eclampsia needs immediate hospital care'),
        'severe headache':  ('RED',    'Severe Headache',           'May indicate pre-eclampsia / BP spike'),
        'blurred vision':   ('RED',    'Blurred Vision',            'Classic pre-eclampsia warning sign'),
        'no fetal movement':('RED',    'Reduced Fetal Movement',    'EMERGENCY - go to hospital for CTG immediately'),
        'swollen face':     ('ORANGE', 'Facial / Hand Swelling',    'Pre-eclampsia sign - check BP immediately'),
        'burning urine':    ('YELLOW', 'Burning Urination',         'UTI common in pregnancy - needs antibiotic treatment'),
    }
    for sym in symptoms:
        for key, (icon, title, detail) in DANGER.items():
            if key in sym.lower():
                risk_score += (3 if icon == 'RED' else 1)
                risk_factors.append({'icon': icon, 'title': title, 'detail': detail})
                if icon == 'RED':
                    recommendations.append(f'URGENT: Seek hospital immediately for {title}.')

    # Risk Level
    if risk_score >= 6:
        risk_level  = 'High Risk'
        risk_color  = '#e63946'
        risk_emoji  = 'RED'
        risk_action = 'IMMEDIATE REFERRAL to PHC/CHC/Hospital required. Do not delay.'
    elif risk_score >= 3:
        risk_level  = 'Moderate Risk'
        risk_color  = '#f4a261'
        risk_emoji  = 'ORANGE'
        risk_action = 'Increased monitoring needed. Visit PHC within 48 hours.'
    else:
        risk_level  = 'Low Risk'
        risk_color  = '#40916c'
        risk_emoji  = 'GREEN'
        risk_action = 'Continue routine ANC. Next visit as scheduled.'

    if not risk_factors:
        risk_factors.append({'icon': 'GREEN', 'title': 'No Major Risk Factors', 'detail': 'All parameters within normal range. Continue routine antenatal care.'})

    medicines = [
        {'name': 'Iron + Folic Acid (IFA) 100mg/500mcg', 'brand': 'Govt IFA Red Tablet / Ferrous Sulfate+FA',
         'type': 'Anemia Prevention (WHO mandated)', 'dose': '1 tablet', 'frequency': 'Once daily (after dinner)',
         'duration': 'Throughout pregnancy + 6 months postpartum',
         'warning': 'Take with Vitamin C (lemon water); avoid tea/milk within 1 hr (reduces absorption)'},
        {'name': 'Calcium 500mg', 'brand': 'Govt Calcium Tablet / Shelcal 500',
         'type': 'Bone and BP protection', 'dose': '1 tablet', 'frequency': 'Twice daily',
         'duration': 'From 20 weeks to delivery',
         'warning': 'Do NOT take at same time as IFA - separate by 2 hours'},
        {'name': 'Vitamin D3 60,000 IU', 'brand': 'D-Rise / Uprise-D3',
         'type': 'Bone and immunity', 'dose': '1 sachet dissolved in water', 'frequency': 'Once a month',
         'duration': '5 months (20-36 weeks)',
         'warning': 'Take with fatty meal for absorption. Available free at PHC.'},
        {'name': 'Tetanus Toxoid (TT) Vaccine', 'brand': 'Govt supplied at PHC (Free)',
         'type': 'Infection prevention for mother and baby', 'dose': '0.5 mL injection',
         'frequency': 'TT1 at first ANC contact, TT2 four weeks later',
         'duration': 'Protects until next pregnancy', 'warning': 'Given free at all PHCs and ASHA centers'},
    ]

    if systolic >= 140 or diastolic >= 90:
        medicines.append({
            'name': 'Methyldopa 250mg', 'brand': 'Alphadopa / Dopamet',
            'type': 'Safe antihypertensive in pregnancy', 'dose': '1 tablet',
            'frequency': '2-3 times daily (as per doctor)', 'duration': 'As prescribed',
            'warning': 'NEVER use ACE inhibitors or ARBs in pregnancy - they are DANGEROUS to baby'
        })

    emergency_signs = [
        {'level': 'RED', 'text': 'Vaginal bleeding at any time'},
        {'level': 'RED', 'text': 'Fits / loss of consciousness'},
        {'level': 'RED', 'text': 'Severe headache + blurred vision'},
        {'level': 'RED', 'text': 'No baby movement for more than 12 hours'},
        {'level': 'RED', 'text': 'High fever (above 38.5 C) with chills'},
        {'level': 'ORANGE', 'text': 'Hands and face swelling (especially morning)'},
        {'level': 'ORANGE', 'text': 'Burning urine or discharge with smell'},
        {'level': 'ORANGE', 'text': 'Breathlessness even at rest'},
    ]

    anc_checklist = [
        {'week': 'Before 12 weeks', 'tasks': [
            'Register pregnancy at ASHA / ANM / PHC',
            'Blood group and Rh factor test',
            'Hemoglobin (Hb) test',
            'Urine test (protein, sugar)',
            'BP and weight check',
            'TT-1 injection',
            'Start IFA + Calcium tablets'
        ]},
        {'week': '14-20 weeks', 'tasks': [
            'Anomaly scan (Level 2 USG)',
            'Double / Triple Marker test (Down syndrome)',
            'Check weight gain (0.5 kg/week expected)',
            'TT-2 injection',
            'Repeat Hb test'
        ]},
        {'week': '24-28 weeks', 'tasks': [
            '75g OGTT (Gestational Diabetes test)',
            'Hemoglobin recheck',
            'Baby movement charting',
            'BP monitoring twice weekly'
        ]},
        {'week': '32-36 weeks', 'tasks': [
            'Growth scan USG',
            'Identify and register at delivery hospital',
            'Birth preparedness plan',
            'Danger signs counselling for family'
        ]},
        {'week': 'After Delivery', 'tasks': [
            'Continue IFA for 6 months postpartum',
            'Breastfeed within 1 hour of birth',
            'Baby immunization (BCG, OPV, Hep-B on Day 0)',
            'Family planning counselling at 6-week visit'
        ]},
    ]

    # - Localized Nutrition Engine -
    nutrition_advice = []
    if hemoglobin < 11.0:
        nutrition_advice.append({
            "title": "Iron-Rich Local Foods (ਰਕਤਹੀਨਤਾ / రక్తహీనత)",
            "foods": ["Drumstick Leaves (Moringa)", "Jaggery (Gur)", "Spinach (Palak)", "Pomegranate", "Lentils (Dal)"],
            "title": "Blood Pressure Management",
            "foods": ["Garlic (Raw)", "Banana (Potassium)", "Curd", "Low salt intake"],
            "why": "Helps in maintaining stable blood pressure."
        })
    if height > 0 and (weight / ((height / 100) ** 2)) > 30:
        nutrition_advice.append({
            "title": "Weight & Sugar Control",
            "foods": ["Ragi (Finger Millet)", "Bitter Gourd (Karela)", "Green Vegetables", "Avoid Sugar/Rice"],
            "why": "Reduces risk of gestational diabetes and complications."
        })
    
    if not nutrition_advice:
        nutrition_advice.append({
            "title": "General Prenatal Nutrition",
            "foods": ["Milk & Eggs", "Mixed Grains", "Fresh Fruits", "Hydration (3L Water)"],
            "why": "Ensures balanced growth for the baby."
        })

    return jsonify({
        'risk_level':     risk_level,
        'risk_color':     risk_color,
        'risk_emoji':     risk_emoji,
        'risk_score':     risk_score,
        'risk_action':    risk_action,
        'risk_factors':   risk_factors,
        'recommendations': recommendations,
        'medicines':      medicines,
        'emergency_signs': emergency_signs,
        'anc_checklist':  anc_checklist,
        'nutrition':      nutrition_advice,
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)


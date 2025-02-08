# Packages required: flask,
from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import json
import webbrowser
import threading
import re

app = Flask(__name__)

JSON_TEMPLATES_FOLDER = "json-templates"

def campaign_root():
    return settings["campaign"]["root"]

def campaign_folder():
    return os.path.join(campaign_root(), settings["campaign"]["current"])

def campaign_file():
    return os.path.join(campaign_folder(), "campaign.json")

# Home page
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/<page_name>")
def render_page(page_name):
    try:
        if page_name == "":
            page_name = "index"
        return render_template(f"{page_name}.html")
    except Exception as e:
        return f"Error loading page {page_name}: {e}", 404

@app.route("/resource/<resource_name>")
def get_resource(resource_name):
    try:
        # Capture the file extension from resource_name
        file_extension = os.path.splitext(resource_name)[1]
        if file_extension in [".jpg", ".jpeg", ".png", ".gif", ".svg"]:
            resource_folder = "images"
        elif file_extension in [".mp3", ".wav", ".ogg"]:
            resource_folder = "audio"
        elif file_extension in [".md", ".txt"]:
            resource_folder = "docs"
        
        return send_from_directory(os.path.join(campaign_folder(), resource_folder), resource_name)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/resource", methods=["POST"])
def insert_update_resource():
    try:
        # Get the file from the request
        file = request.files["file"]
        # Capture the file extension from resource_name
        file_extension = os.path.splitext(file.filename)[1]
        if file_extension in [".jpg", ".jpeg", ".png", ".gif", ".svg"]:
            resource_folder = "images"
        elif file_extension in [".mp3", ".wav", ".ogg"]:
            resource_folder = "audio"
        elif file_extension in [".md", ".txt"]:
            resource_folder = "docs"

        # Create the campaign data point if it doesn't exist
        if os.path.exists(campaign_file()):
            # Read and return contents of project.json
            with open(campaign_file(), "r") as f:
                campaign_data = json.load(f)
                if resource_type == "audio":
                    resource_type = "ambiences" if "-ambience" in file.filename else "bgms"

                resource_data = next((item for item in campaign_data[resource_type] if item["path"] == file.filename), None)
                if resource_data == None:
                    campaign_data[resource_type].append({
                        "path": file.filename,
                        "label": file.filename
                    })
                    with open(campaign_file(), "w") as f:
                        json.dump(campaign_data, f, indent=2)
        
        # Save the file to the campaign folder
        file.save(os.path.join(campaign_folder(), resource_folder, file.filename))
        return jsonify({"message": "File uploaded successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/card", methods=["POST"])
def insert_update_card():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 500
    
    try:
        # Create the campaign data point if it doesn't exist
        campaign_path = campaign_file()
        if os.path.exists(campaign_path):
            # Read and return contents of project.json
            with open(campaign_path, "r") as f:
                campaign_data = json.load(f)
                campaign_data["cards"].append(data)
                with open(campaign_path, "w") as f:
                    json.dump(campaign_data, f, indent=2)
                    return jsonify({"message": "Data saved successfully"}), 200
        else:
            return jsonify({"error": "Campaign does not exist"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Manage campaigns
@app.route("/campaigns", methods=["POST", "GET"])
def manage_campaigns():
    if request.method == "POST":
        try:
            # Convert form payload into JSON
            data = request.get_json()
            
            with open(os.path.join(JSON_TEMPLATES_FOLDER, "campaign.json"), "r") as f:
                template = json.load(f)
                
            data = {
                **template,
                **data
            }
                
            # Create new JSON file in campaigns directory
            id = re.sub(r"[',.]", "", data["name"].strip().replace(" ", "-")).lower()
            data["id"] = id
            
            # Create a new folder for the campaign
            os.makedirs(os.path.join(campaign_root(), id), exist_ok=True)
            
            campaign_path = os.path.join(campaign_root(), id, "campaign.json")
            
            # Write payload to project.json
            with open(campaign_path, "w") as f:
                json.dump(data, f, indent=2)
            return jsonify({"message": "Data saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    if request.method == "GET":
        try:
            # Get list of all folders in campaigns directory
            campaign_folders = [d for d in os.listdir(campaign_root()) if os.path.isdir(os.path.join(campaign_root(), d))]
            campaigns = []
            for folder in campaign_folders:
                campaign_file = os.path.join(campaign_root(), folder, "campaign.json")
                if os.path.exists(campaign_file):
                    with open(campaign_file, "r") as f:
                        data = json.load(f)
                        campaigns.append({
                        "name": data["name"],
                        "description": data["description"],
                        "id": data["id"]
                        })
            return jsonify({"campaigns": campaigns, "current": settings["campaign"]["current"]}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/campaign/current", methods=["POST", "GET"])
def current_campaign():
    if request.method == "POST":
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid or missing JSON payload"}), 400             
            settings["campaign"]["current"] = data["id"]            
            with open("settings.json", "w") as f:
                json.dump(settings, f, indent=2)
            return jsonify({"message": "Data saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    if request.method == "GET":
        try:
            return jsonify({"id": settings["campaign"]["current"]}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
# CRUD operations for specific campaign
@app.route("/campaign", methods=["POST", "PUT", "GET", "DELETE"])
def campaign_data():
    campaign_path = os.path.join(campaign_folder(), "campaign.json")
    if request.method in ["POST", "PUT"]:
        try:
            # Get JSON payload
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid or missing JSON payload"}), 400
            
            # Write payload to project.json
            with open(campaign_path, "w") as f:
                json.dump(data, f, indent=2)
            return jsonify({"message": "Data saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif request.method == "GET":
        try:
            if os.path.exists(campaign_path):
                # Read and return contents of project.json
                with open(campaign_path, "r") as f:
                    data = json.load(f)
                return jsonify(data), 200
            else:
                # Return blank JSON object if file doesn't exist
                return jsonify({}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif request.method == "DELETE":
        try:
            if os.path.exists(campaign_path):
                os.remove(campaign_path)
                return jsonify({"message": "File deleted successfully"}), 200
            else:
                return jsonify({"message": "File does not exist"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# Pull an item from the foundry vtt pf2e module and return it
@app.route("/rule/<folder>/<query>", methods=["GET"])
def get_rule(folder, query):
    rule_path = os.path.join("external-resources/pf2e", "packs", folder)
    try:
        if not os.path.exists(rule_path):
            return jsonify({"error": "Folder does not exist"}), 404

        exact_file_path = os.path.join(rule_path, query.lower().replace(" ", "-") + ".json")
        if os.path.exists(exact_file_path):
            with open(exact_file_path, "r") as f:
                data = json.load(f)
                return jsonify(data), 200
        
        # List all files in the specified folder
        files = os.listdir(rule_path)
        # Search for the first file that partially matches the query
        for file in files:
            if query.lower() in file.lower():
                # Read and return the contents of the matched file
                with open(os.path.join(rule_path, file), "r") as f:
                    data = json.load(f)
                return jsonify(data), 200
        return jsonify({"error": "No matching rule found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
  
def open_browser():
    """Opens the default web browser to the Flask server."""
    webbrowser.open_new("http://127.0.0.1:5000/")

# Run the app
if __name__ == "__main__":
    # Create empty settings file if it doesn't exist
    if not os.path.exists("settings.json"):
        # Copy the settings template to settings.json
        with open(os.path.join(JSON_TEMPLATES_FOLDER, "settings.json"), "r") as f:
            settings_template = json.load(f)
        with open("settings.json", "w") as f:
            json.dump(settings_template, f, indent=2)
            
    # Open settings.json and store its content in the settings variable
    with open("settings.json", "r") as f:
        settings = json.load(f)
        
    print(settings["campaign"]["root"])
        
    # Run the browser in a separate thread to prevent blocking
    threading.Thread(target=open_browser).start()
    app.run(debug=True)

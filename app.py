# Packages required: flask,
from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import json
import webbrowser
import threading
import re

app = Flask(__name__)

# File path for current campaign data
CAMPAIGN_FOLDER = "campaigns"
CURRENT_CAMPAIGN = os.path.join(CAMPAIGN_FOLDER, "current.json")

# Home page
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/tools/<page_name>")
def render_page(page_name):
    try:
        if page_name == "":
            page_name = "index"
        return render_template(f"{page_name}.html")
    except Exception as e:
        return f"Error loading page {page_name}: {e}", 404

@app.route("/campaign-resource/<campaign_name>/<resource_name>")
def get_campaign_resource(campaign_name, resource_name):
    try:
        # Capture the file extension from resource_name
        file_extension = os.path.splitext(resource_name)[1]
        if file_extension in [".jpg", ".jpeg", ".png", ".gif", ".svg"]:
            resource_folder = "images"
        elif file_extension in [".mp3", ".wav", ".ogg"]:
            resource_folder = "audio"
        elif file_extension in [".md", ".txt"]:
            resource_folder = "docs"
        
        return send_from_directory(os.path.join(CAMPAIGN_FOLDER, campaign_name, resource_folder), resource_name)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/campaign-resource/<campaign_name>/<resource_type>", methods=["POST"])
def insert_update_campaign_resource(campaign_name, resource_type):
    if resource_type == "card":
        try:
            # Get JSON payload
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid or missing JSON payload"}), 400
            
            # Create the campaign data point if it doesn't exist
            campaign_path = os.path.join(CAMPAIGN_FOLDER, f"{campaign_name}.json")
            if os.path.exists(campaign_path):
                # Read and return contents of project.json
                with open(campaign_path, "r") as f:
                    campaign_data = json.load(f)
                    campaign_data["cards"].append(data)
                    with open(campaign_path, "w") as f:
                        json.dump(campaign_data, f, indent=2)
            return jsonify({"message": "Data saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
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
            campaign_path = os.path.join(CAMPAIGN_FOLDER, f"{campaign_name}.json")
            if os.path.exists(campaign_path):
                # Read and return contents of project.json
                with open(campaign_path, "r") as f:
                    campaign_data = json.load(f)
                    if resource_type == "audio":
                        resource_type = "ambiences" if "-ambience" in file.filename else "bgms"

                    resource_data = next((item for item in campaign_data[resource_type] if item["path"] == file.filename), None)
                    if resource_data == None:
                        campaign_data[resource_type].append({
                            "path": file.filename,
                            "label": file.filename
                        })
                        with open(campaign_path, "w") as f:
                            json.dump(campaign_data, f, indent=2)
            
            # Save the file to the campaign folder
            file.save(os.path.join(CAMPAIGN_FOLDER, campaign_name, resource_folder, file.filename))
            return jsonify({"message": "File uploaded successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
# List all campaigns
@app.route("/campaigns", methods=["POST", "GET"])
def manage_campaigns():
    if request.method == "POST":
        try:
            # Convert form payload into JSON
            data = request.get_json()
            if not data or "name" not in data:
                return jsonify({"error": "Invalid or missing JSON payload"}), 400
            
            # Create basic campaign structure: name and description
            data["description"] = data.get("description", "")

            # Create image, ambiences, bgm, and cards data structures
            data["images"] = data.get("images", [])
            data["ambiences"] = data.get("ambiences", [])
            data["bgms"] = data.get("bgms", [])
            data["cards"] = data.get("cards", [])
            data["docs"] = data.get("docs", [])

            # Create new JSON file in campaigns directory
            id = re.sub(r"[',.]", "", data["name"].strip().replace(" ", "-")).lower()
            data["id"] = id
            campaign_path = os.path.join(CAMPAIGN_FOLDER, f"{id}.json")
            
            # Write payload to project.json
            with open(campaign_path, "w") as f:
                json.dump(data, f, indent=2)
            return jsonify({"message": "Data saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    try:
        # Get list of all folders in campaigns directory
        campaign_folders = [d for d in os.listdir(CAMPAIGN_FOLDER) if os.path.isdir(os.path.join(CAMPAIGN_FOLDER, d))]
        campaigns = []
        for folder in campaign_folders:
            campaign_file = os.path.join(CAMPAIGN_FOLDER, folder, "campaign.json")
            if os.path.exists(campaign_file):
                with open(campaign_file, "r") as f:
                    data = json.load(f)
                    campaigns.append({
                    "name": data["name"],
                    "description": data["description"],
                    "id": data["id"]
                    })
        return jsonify({"campaigns": campaigns}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# CRUD operations for specific campaign
@app.route("/campaign/<name>", methods=["POST", "PUT", "GET", "DELETE"])
def campaign_data(name):
    campaign_path = os.path.join(CAMPAIGN_FOLDER, name, "campaign.json")
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
    rule_path = os.path.join("pf2e", "packs", folder)
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
    # Run the browser in a separate thread to prevent blocking
    threading.Thread(target=open_browser).start()
    app.run(debug=True)

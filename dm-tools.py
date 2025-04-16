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

def players_root():
    return settings["players"]["root"]

def players_file():
    return os.path.join(players_root(), settings["players"]["current"] + ".json")

titleOf = {
    "index": "Home",
    "card-printer": "Card Printer",
    "creature-creator": "Creature Creator",
    "dm-screen": "DM Screen",
    "pc-screen": "PC Screen",
    "insert-media": "Insert Media",
    "map-editor": "Map Editor",
    "name-generator": "Name Generator",    
}

# Home page
@app.route("/")
def index():
    return render_template("layout.html", title=titleOf["index"], id="index")

# @app.route("/lib/ace/<path:filename>")
# def ace_static(filename):
#     return send_from_directory(os.path.join("external-resources", "ace-builds"), filename)

@app.route("/<page_name>")
def render_page(page_name):
    try:
        if page_name == "":
            page_name = "index"
        return render_template(f"layout.html", title=titleOf.get(page_name, 'WIP'), id=page_name)
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
        elif file_extension in [".json"]:
            resource_folder = "maps"
        
        return send_from_directory(os.path.join(campaign_folder(), resource_folder), resource_name)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/resource", methods=["POST"])
def insert_update_resource():
    try:
        # Get the file from the request
        file = request.files["file"]        
        print(f"saving {file.filename}")
        
        file_extension = os.path.splitext(file.filename)[1]
        if request.form.get("folder"):
            resource_folder = request.form.get("folder")
        else:            
            # Capture the file extension from resource_name
            if file_extension in [".jpg", ".jpeg", ".png", ".gif", ".svg"]:
                resource_folder = "images"
            elif file_extension in [".mp3", ".wav", ".ogg"]:
                resource_folder = "audio"
            elif file_extension in [".md", ".txt"]:
                resource_folder = "docs"
            elif file_extension in [".json"]:
                resource_folder = "maps"
                
        print(f"resource folder: {resource_folder}")

        tags = request.form.get("tags")
        if tags:
            tags = tags.split(",")
        else:
            tags = []
        
        if request.form.get("type"):
            resource_type = request.form.get("type")
            file_prefix = resource_type
            tags.append(resource_type)
            if resource_folder == "images":
                file_prefix = resource_type
                resource_type = "images"
            elif not resource_type in ["ambience", "bgm"]:
                resource_type = resource_folder
            else:
                resource_type = resource_type + "s"
        else:
            resource_type = resource_folder
            file_prefix = resource_folder
            if resource_type == "audio":
                resource_type = "ambiences" if "-ambience" in file.filename else "bgms"
                
        print(f"resource type: {resource_type}")
                
        label = request.form.get("name")
        if label:
            export_filename = file_prefix + "-" + label.replace(" ", "-").lower() + file_extension
        else:
            export_filename = file.filename
            label = file.filename
        
        print(f"export filename: {export_filename}")
        # Create the campaign data point if it doesn't exist
        if os.path.exists(campaign_file()):
            # Read and return contents of project.json
            with open(campaign_file(), "r") as f:
                campaign_data = json.load(f)

                resource_data = next((item for item in campaign_data[resource_type] if item["path"] == export_filename), None)
                if resource_data == None:
                    campaign_data[resource_type].append({
                        "path": export_filename,
                        "label": label,
                        "tags": tags
                    })
                    with open(campaign_file(), "w") as f:
                        json.dump(campaign_data, f, indent=2)
        
        # Save the file to the campaign folder
        file.save(os.path.join(campaign_folder(), resource_folder, export_filename))
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

def manage_current_setting(request, setting_name):
    if request.method == "POST":
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid or missing JSON payload"}), 400             
            settings[setting_name]["current"] = data["current"]            
            with open("settings.json", "w") as f:
                json.dump(settings, f, indent=2)
            return jsonify({"message": "Data saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    if request.method == "GET":
        try:
            return jsonify({"current": settings[setting_name]["current"]}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
def crud_for_data_file(request, file_path):
    if request.method in ["POST", "PUT"]:
        try:
            # Get JSON payload
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid or missing JSON payload"}), 400
            
            # Write payload to project.json
            with open(file_path, "w") as f:
                json.dump(data, f, indent=2)
            return jsonify({"message": "Data saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif request.method == "GET":
        try:
            if os.path.exists(file_path):
                # Read and return contents of project.json
                with open(file_path, "r") as f:
                    data = json.load(f)
                return jsonify(data), 200
            else:
                # Return blank JSON object if file doesn't exist
                return jsonify({}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif request.method == "DELETE":
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return jsonify({"message": "File deleted successfully"}), 200
            else:
                return jsonify({"message": "File does not exist"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# Manage players
@app.route("/players/manage", methods=["POST", "GET"])
def manage_players():
    if request.method == "POST":
        try:
            # Convert form payload into JSON
            init_data = request.get_json()
            
            with open(os.path.join(JSON_TEMPLATES_FOLDER, "players.json"), "r") as f:
                data = json.load(f)
                
            # Create new JSON file in campaigns directory
            id = re.sub(r"[',.]", "", init_data["name"].strip().replace(" ", "-")).lower()
            data["players"]["name"] = init_data["name"]
            data["players"]["id"] = id
            
            # Create a new folder for the campaign
            players_file = os.path.join(players_root(), f"{id}.json")
            
            # Write payload to project.json
            with open(players_file, "w") as f:
                json.dump(data, f, indent=2)
            return jsonify({"message": "Data saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    if request.method == "GET":
        try:
            # Get list of all folders in campaigns directory
            files = [f for f in os.listdir(players_root()) if f.endswith(".json")]
            groups = []
            for file in files:
                with open(os.path.join(players_root(), file), "r") as f:
                    data = json.load(f)
                    groups.append(data)
            return jsonify({"players": groups, "current": settings["players"]["current"]}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/players/current", methods=["POST", "GET"])
def current_players():
    return manage_current_setting(request, "players")

@app.route("/players", methods=["POST", "PUT", "GET", "DELETE"])
def players_data():
    return crud_for_data_file(request, players_file())

# Manage campaigns
@app.route("/campaign/manage", methods=["POST", "GET"])
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
    return manage_current_setting(request, "campaign")
        
# CRUD operations for specific campaign
@app.route("/campaign", methods=["POST", "PUT", "GET", "DELETE"])
def campaign_data():
    return crud_for_data_file(request, campaign_file())

@app.route("/rule/search/<query>", methods=["GET"])
def search_rule(query):
    rule_folders = ["spells"]
    rule_path = os.path.join("external-resources/pf2e", "packs")
    try:
        if not os.path.exists(rule_path):
            return jsonify({"error": "Folder does not exist"}), 404
        
        results = []        
        for folder in rule_folders:
            rule_folder = os.path.join(rule_path, folder)

            # List all files in the specified folder
            files = os.listdir(rule_folder)
            
            # Search for the first file that partially matches the query
            for file in files:
                if query.lower() in file.lower():
                    results.append({
                        "folder": folder,
                        "file": file,
                        "label": file
                    })
                    
        return jsonify(results), 200    
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

@app.route("/tileset", methods=["GET"])
def get_tilesets():
    tileset_path = os.path.join("editor-resources", "tiles.json")
    tileinv_path = os.path.join("dm", "tile-inventory.json")
    try:
        if not os.path.exists(tileset_path):
            return jsonify({"error": "Tileset file does not exist"}), 404
        if not os.path.exists(tileinv_path):
            return jsonify({"error": "Tile inventory file does not exist"}), 404

        with open(tileset_path, "r") as f:
            with open(tileinv_path, "r") as f2:
                data = json.load(f)
                inv = json.load(f2)
                for tile in data["tiles"]:
                    for inv_tile in inv["tiles"]:
                        if tile["path"] == inv_tile["path"]:
                            tile["inventory"] = inv_tile["count"]
            return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/tile/<filename>", methods=["GET"])
def get_tile(filename):
    tileset_folder = os.path.join("editor-resources", "tiles")
    return send_from_directory(tileset_folder, filename)
    
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

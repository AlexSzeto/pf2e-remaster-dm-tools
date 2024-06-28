import os
import json

def parse_string(string):
  # Split the string into words
  words = string.split('-')

  # Iterate over each word
  for i in range(len(words)):
    # Check if the word is "at", "of", or "the"
    if words[i].lower() not in ["at", "of", "the"]:
      # Capitalize the word
      words[i] = words[i].capitalize()

  # Join the words back into a string
  parsed_string = " ".join(words)

  return parsed_string

# Path to the decks folder
decks_folder = './decks/'

# Get a list of all folders in the decks folder
folders = [f for f in os.listdir(decks_folder) if os.path.isdir(os.path.join(decks_folder, f))]

# Dictionary to store the file arrays
decks = {}

# Iterate over each folder
for folder in folders:
  folder_path = os.path.join(decks_folder, folder)
  # Get a list of all files in the folder
  files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
  # Get a list of all files in the folder with relative paths
  files = [os.path.join(decks_folder, folder, f).replace('\\', '/') for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]

  # Create a dictionary for the current folder
  decks[folder] = {}

  # Split files into arrays based on file type
  # Store the files in the object
  images = [f for f in files if f.endswith('.png')]
  decks[folder]['images'] = []
  for file in images:
    filename = os.path.splitext(os.path.basename(file))[0]
    decks[folder]['images'].append({
      'label': parse_string(filename),
      'path': file
    })

  bgms = [f for f in files if f.endswith('.mp3') and '-bgm' in f]
  decks[folder]['bgms'] = []
  for file in bgms:
    filename = os.path.splitext(os.path.basename(file))[0]
    decks[folder]['bgms'].append({
      'label': parse_string(filename),
      'path': file
    })

  ambiences = [f for f in files if f.endswith('.mp3') and '-ambience' in f]
  decks[folder]['ambiences'] = []
  for file in ambiences:
    filename = os.path.splitext(os.path.basename(file))[0]
    decks[folder]['ambiences'].append({
      'label': parse_string(filename),
      'path': file
    })

  # open the cards JSON file and add its data to the object
  cards_file = os.path.join(decks_folder, folder + '-cards.json')
  # Check if the cards_file exists
  if os.path.isfile(cards_file):
    with open(cards_file) as f:
      decks[folder]['cards'] = json.load(f)['cards']
  else:
    print(f"Cards file {cards_file} does not exist.")

# Path to the output JSON file
output_file = './decks/decks.json'

# Write the dictionary to the JSON file
with open(output_file, 'w') as f:
  json.dump(decks, f, indent=2)
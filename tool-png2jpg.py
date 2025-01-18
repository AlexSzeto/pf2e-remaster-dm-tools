from PIL import Image
import os
import sys

# Check if the user provided a folder path as an argument
if len(sys.argv) != 2:
    print("Usage: python convert_png_to_jpg.py <folder_path>")
    sys.exit(1)

# Get the folder path from the argument
folder_path = sys.argv[1]

# Check if the provided path is a valid directory
if not os.path.isdir(folder_path):
    print(f"Error: {folder_path} is not a valid directory.")
    sys.exit(1)

# Iterate through all files in the specified directory
for filename in os.listdir(folder_path):
    if filename.lower().endswith(".png"):
        file_path = os.path.join(folder_path, filename)
        # Open the PNG file
        with Image.open(file_path) as img:
            # Convert the image to RGB (JPEG doesn't support transparency)
            rgb_img = img.convert("RGB")
            # Create a new filename with the .jpg extension
            new_filename = os.path.splitext(filename)[0] + ".jpg"
            new_file_path = os.path.join(folder_path, new_filename)
            # Save the image as a JPEG with 70% quality
            rgb_img.save(new_file_path, "JPEG", quality=70)
            print(f"Converted {file_path} to {new_file_path}")

print("Conversion complete.")

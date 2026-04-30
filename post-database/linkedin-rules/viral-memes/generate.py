#!/usr/bin/env python3
"""
Generate a meme image using Google Gemini 2.5 Flash Image (Nano Banana).

Usage:
    python3 generate.py "<image prompt>" [output_path] [reference_image_path]

If a reference image path is provided, the model will edit/remix it.
Otherwise it generates from scratch.
"""
import os
import sys
from pathlib import Path

# Load API key from ~/.vectorlabs/.env
env_path = Path.home() / ".vectorlabs" / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("GEMINI_API_KEY="):
            os.environ["GEMINI_API_KEY"] = line.split("=", 1)[1].strip()
            break

from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

def main():
    if len(sys.argv) < 2:
        print("Usage: generate.py '<prompt>' [output_path] [reference_image]")
        sys.exit(1)

    prompt = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "meme.png"
    reference = sys.argv[3] if len(sys.argv) > 3 else None

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    contents = [prompt]
    if reference and Path(reference).exists():
        contents.append(Image.open(reference))

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=contents,
    )

    saved = False
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            img = Image.open(BytesIO(part.inline_data.data))
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            img.save(output_path)
            print(f"Saved: {output_path}")
            saved = True
        elif part.text:
            print(part.text)

    if not saved:
        print("ERROR: No image returned by the model.")
        sys.exit(1)

if __name__ == "__main__":
    main()

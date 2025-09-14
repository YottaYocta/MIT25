#!/usr/bin/env python3
"""
Test script to measure API performance for Hunyuan3D-2 API server
"""

import base64
import json
import time
import requests
from pathlib import Path


def encode_image_to_base64(image_path):
    """Convert image file to base64 string"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def test_api_performance():
    """Test the API performance with the specified image"""

    # Configuration
    api_url = "http://10.181.86.108:8080/generate"
    image_path = "IMG_test.png"
    output_path = "test_output.glb"

    # Check if image exists
    if not Path(image_path).exists():
        print(f"❌ Error: Image file not found at {image_path}")
        return

    print(f"🚀 Testing API performance with image: {image_path}")
    print(f"📡 API endpoint: {api_url}")
    print("-" * 60)

    try:
        # Encode image to base64
        print("📷 Encoding image to base64...")
        start_encode = time.time()
        image_base64 = encode_image_to_base64(image_path)
        encode_time = time.time() - start_encode
        print(f"✅ Image encoded in {encode_time:.2f} seconds")

        # Prepare request payload
        payload = {"image": image_base64, "texture": False}

        headers = {"Content-Type": "application/json"}

        # Make API request
        print("🔄 Sending request to API...")
        start_request = time.time()

        response = requests.post(
            api_url, headers=headers, json=payload, timeout=300  # 5 minute timeout
        )

        request_time = time.time() - start_request

        # Check response
        if response.status_code == 200:
            print(f"✅ API request successful in {request_time:.2f} seconds")

            # Save the GLB file
            with open(output_path, "wb") as f:
                f.write(response.content)

            file_size = len(response.content)
            print(f"💾 GLB file saved: {output_path} ({file_size:,} bytes)")

            # Performance summary
            total_time = encode_time + request_time
            print("\n" + "=" * 60)
            print("📊 PERFORMANCE SUMMARY")
            print("=" * 60)
            print(f"Image encoding time:  {encode_time:.2f}s")
            print(f"API processing time:  {request_time:.2f}s")
            print(f"Total time:          {total_time:.2f}s")
            print(f"Output file size:    {file_size:,} bytes")
            print("=" * 60)

        else:
            print(f"❌ API request failed with status code: {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print("❌ Request timed out (>5 minutes)")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - check if API server is running")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")


if __name__ == "__main__":
    test_api_performance()

import os
from rembg import remove
from PIL import Image

def process(input_path, output_path):
    try:
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        output_image.save(output_path)
        print(f"Processed {input_path} to {output_path}")
    except Exception as e:
        print(f"Failed {input_path}: {e}")

process("f:/TKHSAS/public/images/book4.png", "f:/TKHSAS/public/hero-book4.png")

from PIL import Image

def remove_white_bg(input_path, output_path, tolerance=15):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # item is (R, G, B, A)
            if item[0] >= 255 - tolerance and item[1] >= 255 - tolerance and item[2] >= 255 - tolerance:
                # Replace white-ish with transparent
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path} to {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

remove_white_bg("f:/TKHSAS/public/images/book1.png", "f:/TKHSAS/public/hero-book1.png", tolerance=20)
remove_white_bg("f:/TKHSAS/public/images/book2.png", "f:/TKHSAS/public/hero-book2.png", tolerance=20)
remove_white_bg("f:/TKHSAS/public/images/book3.png", "f:/TKHSAS/public/hero-book3.png", tolerance=20)
remove_white_bg("f:/TKHSAS/public/images/book4.png", "f:/TKHSAS/public/hero-book4.png", tolerance=20)

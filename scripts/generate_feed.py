import json
import re
from datetime import datetime
import os

# Configuration
PRODUCTS_FILE = 'products.json'
OUTPUT_FILE = 'google_feed.xml'
BASE_URL = 'https://sherow1982.github.io/matager-makhzoon-alemarat'
STORE_NAME = 'Makhzoon Alemarat'
STORE_DESCRIPTION = 'Best deals in UAE for watches and accessories.'

# List of Luxury Brands to Exclude (Case Insensitive)
# These are the brands that trigger "Counterfeit Goods" violations if prices are too low.
FORBIDDEN_KEYWORDS = [
    "rolex", "bvlgari", "bulgari", "gucci", "louis vuitton", "lv", "chanel", 
    "dior", "cartier", "omega", "breitling", "patek", "audemars", "hublot", 
    "tag heuer", "panerai", "iwc", "richard mille", "versace", "fendi", 
    "prada", "hermes", "burberry"
]

def load_products():
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def is_safe_product(product):
    title = product.get('title', '').lower()
    description = product.get('description', '').lower()
    
    for brand in FORBIDDEN_KEYWORDS:
        if brand in title or brand in description:
            return False
    return True

def generate_xml(products):
    xml = '<?xml version="1.0"?>\n'
    xml += '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n'
    xml += '<channel>\n'
    xml += f'<title>{STORE_NAME}</title>\n'
    xml += f'<link>{BASE_URL}</link>\n'
    xml += f'<description>{STORE_DESCRIPTION}</description>\n'
    
    safe_count = 0
    skipped_count = 0
    
    for product in products:
        if not is_safe_product(product):
            skipped_count += 1
            print(f"Skipping branded item: {product['title']}")
            continue
            
        safe_count += 1
        
        # Prepare data
        pid = product.get('id')
        title = product.get('title')
        # Simple slug generation
        slug = title.replace(' ', '-').replace('/', '-')
        link = f"{BASE_URL}/?product={slug}"
        image_link = product.get('image link')
        price = f"{product.get('price')} AED"
        sale_price = f"{product.get('sale price')} AED" if product.get('sale price') else ""
        condition = product.get('condition', 'new')
        availability = product.get('availability', 'in_stock')
        
        xml += '<item>\n'
        xml += f'<g:id>{pid}</g:id>\n'
        xml += f'<g:title>{title}</g:title>\n'
        xml += f'<g:description>{title} - Great quality product from {STORE_NAME}</g:description>\n'
        xml += f'<g:link>{link}</g:link>\n'
        xml += f'<g:image_link>{image_link}</g:image_link>\n'
        xml += f'<g:condition>{condition}</g:condition>\n'
        xml += f'<g:availability>{availability}</g:availability>\n'
        xml += f'<g:price>{price}</g:price>\n'
        if sale_price:
             xml += f'<g:sale_price>{sale_price}</g:sale_price>\n'
        xml += '</item>\n'
        
    xml += '</channel>\n'
    xml += '</rss>'
    
    return xml, safe_count, skipped_count

def main():
    print("Starting Feed Generation...")
    try:
        products = load_products()
        xml_content, safe, skipped = generate_xml(products)
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(xml_content)
            
        print(f"\nSUCCESS! generated {OUTPUT_FILE}")
        print(f"Total Products: {len(products)}")
        print(f"Included (Safe): {safe}")
        print(f"Excluded (Branded): {skipped}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

import os
import glob
import re

def clean_data():
    archive_dir = r"d:\Asia_Uni\Ky_3\Advanced Programing\Project\data\crawler_archive"
    output_dir = r"d:\Asia_Uni\Ky_3\Advanced Programing\Project\data\data_cleaned"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    files = glob.glob(os.path.join(archive_dir, "*.txt"))
    
    skip_keywords = ['_tag_', '_author_', '_en_', '_bai-viet_', 'careerconsultation']
    
    processed_count = 0
    skipped_count = 0
    
    for file_path in files:
        filename = os.path.basename(file_path)
        
        # Skip garbage files
        if any(kw in filename.lower() for kw in skip_keywords):
            skipped_count += 1
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Clean text
        lines = content.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line_strip = line.strip()
            
            # Stop if we hit footer sections
            if line_strip.upper() in ["LIÊN HỆ VỚI CHÚNG TÔI", "TIN TỨC MỚI NHẤT", "TIN TỨC LIÊN QUAN"]:
                break
                
            # Skip boilerplate lines
            if line_strip == "Bỏ qua nội dung":
                continue
            if line_strip.startswith("Nguồn:"):
                continue
            if line_strip.startswith("-------------------------"):
                continue
                
            if line_strip:
                cleaned_lines.append(line_strip)
                
        cleaned_content = '\n'.join(cleaned_lines)
        
        # Only save if there's substantial content (e.g. > 200 chars)
        if len(cleaned_content) > 200:
            out_path = os.path.join(output_dir, filename)
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)
            processed_count += 1
        else:
            skipped_count += 1
            
    print(f"Data cleaning complete!")
    print(f"Processed and saved: {processed_count} files to {output_dir}")
    print(f"Skipped (tags, authors, empty, etc.): {skipped_count} files")

if __name__ == "__main__":
    clean_data()

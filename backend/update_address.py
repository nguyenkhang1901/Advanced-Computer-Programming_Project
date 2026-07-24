
import os
import re

directory = "d:/Asia_Uni/Ky_3/Advanced Programing/Project/data/crawler_archive"
old_address_pattern = re.compile(r"34 B\u1ea1ch \u0110\u1eb1ng[^.]*H\u1ed3 Ch\u00ed Minh|34 B\u1ea1ch \u0110\u1eb1ng[^.]*HCM|34 B\u1ea1ch \u0110\u1eb1ng[^.]*T\u00e2n S\u01a1n H\u00f2a[^.]*", re.IGNORECASE)
new_address = "485 Lê Quang Ð?nh, Phu?ng H?nh Thông, TP. H? Chí Minh"

count = 0
for filename in os.listdir(directory):
    if filename.endswith(".txt"):
        filepath = os.path.join(directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        new_content, num_subs = old_address_pattern.subn(new_address, content)
        
        if num_subs > 0:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            count += 1

print(f"Updated {count} files.")


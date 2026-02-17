import os

file_path = r'c:\Users\bytes\OneDrive\Documents\DEV Bytes\test\client\src\pages\dashboard\PropertyDetail.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Search for the management type badge and insert status badge after it
new_lines = []
found = False
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'property.management_type_display || property.management_type' in line and not found:
        # We are at line 346. The closing </span> is usually next.
        # But let's find the closing </span> specifically.
        j = i + 1
        while j < len(lines) and '</span>' not in lines[j]:
            new_lines.append(lines[j])
            j += 1
        
        if j < len(lines):
            # Append the closing span of management type
            new_lines.append(lines[j])
            
            # Now insert the status badge
            indent = "                                " # approx 32 spaces
            status_badge = f"""{indent}<span className={{cn(
{indent}    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
{indent}    property.status === 'EN_COURS' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
{indent}        property.status === 'LIVRE' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
{indent}            property.status === 'VENDU' ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200" :
{indent}                "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
{indent})}}>
{indent}    {{property.status_display || property.status}}
{indent}</span>
"""
            # Ensure proper line endings for the inserted block
            status_badge_lines = status_badge.split('\n')
            for sbl in status_badge_lines:
                if sbl.strip() or sbl == "":
                    new_lines.append(sbl + '\n')
            
            found = True
            # We already added the line at j, so skip processing it in the main loop
            # But wait, the main loop will continue from i+1.
            # So we should skip j lines.
            # Actually, let's just use a traditional while loop for better control.
            break

# If we used a break, we need to add the rest of the lines
if found:
    remaining_lines = lines[j+1:]
    new_lines.extend(remaining_lines)
    
    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        f.writelines(new_lines)
    print("Successfully patched PropertyDetail.jsx using line logic.")
else:
    print("Could not find targeting line in PropertyDetail.jsx.")

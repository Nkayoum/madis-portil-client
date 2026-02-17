import os

def patch_file(path, old_block, new_block):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return False
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Normalize line endings
    content = content.replace('\r\n', '\n')
    old_block = old_block.replace('\r\n', '\n')
    new_block = new_block.replace('\r\n', '\n')
    
    if old_block in content:
        new_content = content.replace(old_block, new_block)
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(new_content.replace('\n', '\r\n'))
        print(f"Successfully patched {os.path.basename(path)}")
        return True
    else:
        print(f"Failed to find block in {os.path.basename(path)}")
        return False

# 1. Patch PropertiesList.jsx
properties_list_path = r'c:\Users\bytes\OneDrive\Documents\DEV Bytes\test\client\src\pages\dashboard\PropertiesList.jsx'
old_pl_block = """                                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shadow-sm",
                                        property.category === 'RESIDENTIEL' ? "bg-blue-600" :
                                            property.category === 'COMMERCIAL' ? "bg-orange-600" : "bg-purple-600"
                                    )}>
                                        {property.category_display}
                                    </span>
                                    {property.management_type !== 'CONSTRUCTION' ? (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shadow-sm",
                                            property.transaction_nature === 'VENTE' ? "bg-emerald-600" : "bg-blue-600"
                                        )}>
                                            {property.transaction_nature_display}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                            Chantier
                                        </span>
                                    )}
                                </div>"""

new_pl_block = """                                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                                    {property.status === 'VENDU' ? (
                                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm border border-slate-700">
                                            Vendu
                                        </span>
                                    ) : (
                                        <>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shadow-sm",
                                                property.category === 'RESIDENTIEL' ? "bg-blue-600" :
                                                    property.category === 'COMMERCIAL' ? "bg-orange-600" : "bg-purple-600"
                                            )}>
                                                {property.category_display}
                                            </span>
                                            {property.management_type !== 'CONSTRUCTION' ? (
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shadow-sm",
                                                    property.transaction_nature === 'VENTE' ? "bg-emerald-600" : "bg-blue-600"
                                                )}>
                                                    {property.transaction_nature_display}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                    Chantier
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>"""

# 2. Patch PropertyDetail.jsx
property_detail_path = r'c:\Users\bytes\OneDrive\Documents\DEV Bytes\test\client\src\pages\dashboard\PropertyDetail.jsx'
old_pd_block = """                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    property.management_type === 'MANDAT' ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" :
                                        property.management_type === 'GESTION' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                )}>
                                    {property.management_type_display || property.management_type}
                                </span>"""

new_pd_block = """                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    property.management_type === 'MANDAT' ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" :
                                        property.management_type === 'GESTION' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                )}>
                                    {property.management_type_display || property.management_type}
                                </span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    property.status === 'EN_COURS' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                        property.status === 'LIVRE' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                            property.status === 'VENDU' ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200" :
                                                "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                )}>
                                    {property.status_display || property.status}
                                </span>"""

patch_file(properties_list_path, old_pl_block, new_pl_block)
patch_file(property_detail_path, old_pd_block, new_pd_block)

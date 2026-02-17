import os
import sys

# Use absolute path and verify it exists
file_path = os.path.abspath(r'c:\Users\bytes\OneDrive\Documents\DEV Bytes\test\client\src\pages\dashboard\PropertyDetail.jsx')

if not os.path.exists(file_path):
    print(f"ERROR: File not found at {file_path}")
    sys.exit(1)

print(f"Found file at {file_path}")

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize line endings to avoid matching issues
content = content.replace('\r\n', '\n')

# 1. Patch Yield Cards (wrap in condition)
# We match from the first card container to the end of the second card container.
old_yield_block = """                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rendement Réel</span>
                                            <TrendingUp className="h-4 w-4 text-[#10B981]" />
                                        </div>
                                        <div className="text-2xl font-black text-[#10B981]">{perfData.property_summary.yield}%</div>
                                        <p className="text-[10px] text-muted-foreground mt-1">Basé sur les revenus réels</p>
                                    </div>
                                    <div className="bg-card border rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rendement Théorique</span>
                                            <Activity className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="text-2xl font-black">{perfData.property_summary.theoretical_yield}%</div>
                                        <p className="text-[10px] text-muted-foreground mt-1">Objectif basé sur loyer cible</p>
                                    </div>"""

new_yield_block = """                                    {(!(property.transaction_nature === 'VENTE' && !property.loyer_mensuel)) ? (
                                        <>
                                            <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rendement Réel</span>
                                                    <TrendingUp className="h-4 w-4 text-[#10B981]" />
                                                </div>
                                                <div className="text-2xl font-black text-[#10B981]">{perfData.property_summary.yield}%</div>
                                                <p className="text-[10px] text-muted-foreground mt-1">Basé sur les revenus réels</p>
                                            </div>
                                            <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rendement Théorique</span>
                                                    <Activity className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="text-2xl font-black">{perfData.property_summary.theoretical_yield}%</div>
                                                <p className="text-[10px] text-muted-foreground mt-1">Objectif basé sur loyer cible</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plus-value Estimée</span>
                                                    <TrendingUp className="h-4 w-4 text-[#10B981]" />
                                                </div>
                                                <div className="text-2xl font-black text-[#10B981]">
                                                   {property.prix_vente && property.prix_acquisition ? 
                                                       (Number(property.prix_vente) - (Number(property.prix_acquisition) + Number(property.frais_acquisition_annexes || 0))).toLocaleString() + '€' 
                                                       : 'N/A'
                                                   }
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">Prix vente - Coût total achat</p>
                                            </div>
                                            <div className="bg-card border rounded-xl p-5 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ROI Global Estimé</span>
                                                    <Percent className="h-4 w-4 text-[#10B981]" />
                                                </div>
                                                <div className="text-2xl font-black">
                                                   {property.prix_vente && property.prix_acquisition ? 
                                                       (((Number(property.prix_vente) / (Number(property.prix_acquisition) + Number(property.frais_acquisition_annexes || 0))) - 1) * 100).toFixed(1) + '%' 
                                                       : 'N/A'
                                                   }
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">Calculé sur la revente</p>
                                            </div>
                                        </>
                                    )}"""

# Normalize old_yield_block just in case
old_yield_block = old_yield_block.replace('\r\n', '\n')
new_yield_block = new_yield_block.replace('\r\n', '\n')

if old_yield_block in content:
    content = content.replace(old_yield_block, new_yield_block)
    print("SUCCESS: Yield block patched.")
else:
    print("FAILURE: Yield block not found exactly.")

# 2. Patch ReferenceLine
old_ref_line = """                                                    <ReferenceLine
                                                        y={perfData.expected_monthly_rent}
                                                        label={{ position: 'top', value: `Loyers attendus : ${perfData.expected_monthly_rent}€`, fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                                                        stroke="#64748b"
                                                        strokeDasharray="5 5"
                                                    />"""
old_ref_line = old_ref_line.replace('\r\n', '\n')

new_ref_line = """                                                    {perfData.expected_monthly_rent > 0 && (
                                                        <ReferenceLine
                                                            y={perfData.expected_monthly_rent}
                                                            label={{ position: 'top', value: `Loyers attendus : ${perfData.expected_monthly_rent}€`, fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                                                            stroke="#64748b"
                                                            strokeDasharray="5 5"
                                                        />
                                                    )}"""
new_ref_line = new_ref_line.replace('\r\n', '\n')

if old_ref_line in content:
    content = content.replace(old_ref_line, new_ref_line)
    print("SUCCESS: ReferenceLine patched.")
else:
    print("FAILURE: ReferenceLine not found exactly.")

# Restore original line endings (CRLF for Windows)
content = content.replace('\n', '\r\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("File write complete.")

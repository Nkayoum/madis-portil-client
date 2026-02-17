import os

file_path = r'c:\Users\bytes\OneDrive\Documents\DEV Bytes\test\client\src\pages\dashboard\PropertyDetail.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Patch Yield Cards (wrap in condition)
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

# Use a more robust split/join replacement if possible or just replace if exact
if old_yield_block in content:
    content = content.replace(old_yield_block, new_yield_block)
    print("Yield block patched.")
else:
    print("Yield block NOT matched exactly. Trying looser match...")
    # Attempt a more flexible match if needed? No, let's try to be precise first.

# 2. Patch ReferenceLine (wrap in condition)
old_ref_line = """                                                    <ReferenceLine
                                                        y={perfData.expected_monthly_rent}
                                                        label={{ position: 'top', value: `Loyers attendus : ${perfData.expected_monthly_rent}€`, fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                                                        stroke="#64748b"
                                                        strokeDasharray="5 5"
                                                    />"""

new_ref_line = """                                                    {perfData.expected_monthly_rent > 0 && (
                                                        <ReferenceLine
                                                            y={perfData.expected_monthly_rent}
                                                            label={{ position: 'top', value: `Loyers attendus : ${perfData.expected_monthly_rent}€`, fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                                                            stroke="#64748b"
                                                            strokeDasharray="5 5"
                                                        />
                                                    )}"""

if old_ref_line in content:
    content = content.replace(old_ref_line, new_ref_line)
    print("ReferenceLine patched.")
else:
    print("ReferenceLine NOT matched exactly.")

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

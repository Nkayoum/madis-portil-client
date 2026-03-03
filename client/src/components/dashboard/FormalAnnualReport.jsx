import { cn, formatCurrency } from '../../lib/utils';

export default function FormalAnnualReport({ data, selectedYear, letterheadUrl, reportRef }) {
    if (!data) return null;

    const categories = data.category_stats || [];
    const revenueCategories = categories.filter(c =>
        ['RENT', 'PROMOTION_SALE', 'CASH_CALL'].includes(c.category)
    );
    const expenseCategories = categories.filter(c =>
        !['RENT', 'PROMOTION_SALE', 'CASH_CALL'].includes(c.category)
    );

    const totalRevenue = revenueCategories.reduce((sum, c) => sum + c.total, 0);
    const totalExpense = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const netResult = totalRevenue - totalExpense;
    const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const hasLetterhead = !!letterheadUrl;

    return (
        <div
            ref={reportRef}
            style={{
                width: '794px',
                minHeight: '1123px',
                fontFamily: 'Inter, Arial, sans-serif',
                color: '#111',
                background: hasLetterhead ? 'transparent' : '#fff',
                position: 'relative',
                boxSizing: 'border-box',
                padding: 0,
            }}
        >

            {/* Content container — positioned to avoid header/footer zones */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                /* When letterhead is loaded, add generous margins to stay within the body zone */
                paddingTop: hasLetterhead ? '180px' : '48px',
                paddingBottom: hasLetterhead ? '120px' : '48px',
                paddingLeft: '56px',
                paddingRight: '56px',
            }}>

                {/* ===== Built-in Header (hidden when custom letterhead is active) ===== */}
                {!hasLetterhead && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111', paddingBottom: '24px', marginBottom: '32px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>MADIS</h1>
                            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700, color: '#666', margin: '4px 0 0 0' }}>Investissement & Gestion Immobilière</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'underline', margin: '0 0 6px 0' }}>Rapport Annuel de Trésorerie</h2>
                            <p style={{ fontSize: '13px', fontWeight: 500, margin: '2px 0' }}>Exercice Fiscal : {selectedYear}</p>
                            <p style={{ fontSize: '11px', color: '#888', margin: '2px 0' }}>Édité le {dateStr}</p>
                        </div>
                    </div>
                )}

                {/* Report title (shown on letterhead mode as a simple title) */}
                {hasLetterhead && (
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0' }}>Rapport Annuel de Trésorerie</h2>
                        <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Exercice Fiscal : {selectedYear}  •  Édité le {dateStr}</p>
                    </div>
                )}

                {/* Entity Information (only in standalone mode) */}
                {!hasLetterhead && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '28px', fontSize: '13px' }}>
                        <div>
                            <h3 style={{ fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px', fontSize: '12px' }}>Gestionnaire</h3>
                            <p style={{ fontWeight: 700, color: '#047857', margin: '2px 0' }}>MaDis Solaris</p>
                            <p style={{ margin: '2px 0' }}>Département Finance & Régie</p>
                            <p style={{ margin: '2px 0' }}>Paris, France</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h3 style={{ fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px', fontSize: '12px', textAlign: 'right' }}>Rapport Consolidé</h3>
                            <p style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontStyle: 'italic', margin: '2px 0' }}>Document Administratif</p>
                            <p style={{ margin: '2px 0' }}>Certifié conforme aux flux bancaires</p>
                        </div>
                    </div>
                )}

                {/* ===== Executive Summary ===== */}
                <div style={{ marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', background: '#f3f4f6', padding: '6px 10px', borderLeft: '4px solid #111', marginBottom: '12px' }}>
                        Résumé Exécutif ({selectedYear})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '1px solid #ddd', textAlign: 'center' }}>
                        <div style={{ padding: '12px', borderRight: '1px solid #ddd' }}>
                            <p style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, color: '#888', margin: '0 0 4px 0' }}>Recettes Totales</p>
                            <p style={{ fontSize: '16px', fontWeight: 900, color: '#047857', margin: 0 }}>{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div style={{ padding: '12px', borderRight: '1px solid #ddd' }}>
                            <p style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, color: '#888', margin: '0 0 4px 0' }}>Dépenses Totales</p>
                            <p style={{ fontSize: '16px', fontWeight: 900, color: '#be123c', margin: 0 }}>{formatCurrency(totalExpense)}</p>
                        </div>
                        <div style={{ padding: '12px', background: '#f9fafb' }}>
                            <p style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, color: '#888', margin: '0 0 4px 0' }}>Bilan Net Annuel</p>
                            <p style={{ fontSize: '16px', fontWeight: 900, textDecoration: 'underline', color: netResult >= 0 ? '#111' : '#9f1239', margin: 0 }}>{formatCurrency(netResult)}</p>
                        </div>
                    </div>
                </div>

                {/* ===== Revenue Table ===== */}
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#047857', marginBottom: '8px' }}>1. Détail des Encaissements</h4>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #ddd' }}>
                                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #ddd', textTransform: 'uppercase', fontSize: '9px' }}>Désignation</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right', textTransform: 'uppercase', fontSize: '9px' }}>Montant Consolidé</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenueCategories.map(cat => (
                                <tr key={cat.category} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '6px 8px', borderRight: '1px solid #ddd' }}>{cat.label}</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(cat.total, true)}</td>
                                </tr>
                            ))}
                            {revenueCategories.length === 0 && (
                                <tr><td colSpan="2" style={{ padding: '10px', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>Aucun encaissement enregistré</td></tr>
                            )}
                            <tr style={{ background: '#f9fafb', fontWeight: 900, fontStyle: 'italic' }}>
                                <td style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #ddd' }}>SOUS-TOTAL RECETTES</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', color: '#047857', textDecoration: 'underline' }}>{formatCurrency(totalRevenue, true)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ===== Expense Table ===== */}
                <div style={{ marginBottom: '28px' }}>
                    <h4 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#be123c', marginBottom: '8px' }}>2. Détail des Décaissements</h4>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #ddd' }}>
                                <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #ddd', textTransform: 'uppercase', fontSize: '9px' }}>Désignation</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right', textTransform: 'uppercase', fontSize: '9px' }}>Montant Consolidé</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenseCategories.map(cat => (
                                <tr key={cat.category} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '6px 8px', borderRight: '1px solid #ddd' }}>{cat.label}</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(cat.total, true)}</td>
                                </tr>
                            ))}
                            {expenseCategories.length === 0 && (
                                <tr><td colSpan="2" style={{ padding: '10px', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>Aucune charge enregistrée</td></tr>
                            )}
                            <tr style={{ background: '#f9fafb', fontWeight: 900, fontStyle: 'italic' }}>
                                <td style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #ddd' }}>SOUS-TOTAL DÉPENSES</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', color: '#be123c', textDecoration: 'underline' }}>{formatCurrency(totalExpense, true)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ===== Built-in Footer (hidden when custom letterhead is active) ===== */}
                {!hasLetterhead && (
                    <>
                        <div style={{ borderTop: '1px solid #ddd', paddingTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', fontSize: '9px', lineHeight: 1.6, fontStyle: 'italic', color: '#888' }}>
                            <div>
                                <p style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', fontStyle: 'normal', color: '#111', fontSize: '10px' }}>Notes administratives</p>
                                <p>Ce document est généré de manière automatisée par le portail MaDis à partir des historiques de transactions validés. Il ne saurait se substituer à une déclaration fiscale officielle mais constitue une aide rigoureuse à la préparation comptable.</p>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <div style={{ width: '128px', height: '64px', border: '1px solid #ddd', background: '#fafafa', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ opacity: 0.2, fontSize: '7px' }}>Cachet MaDis Solaris</span>
                                </div>
                                <p style={{ fontWeight: 700, color: '#111', borderTop: '1px solid #111', paddingTop: '4px', width: '192px', textAlign: 'center', textTransform: 'uppercase', fontStyle: 'normal', fontSize: '10px' }}>Validation Trésorerie</p>
                            </div>
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '7px', color: '#bbb', marginTop: '48px', textTransform: 'uppercase', letterSpacing: '4px' }}>
                            Madis Solaris — Rapport Annuel de Performance © {new Date().getFullYear()}
                        </p>
                    </>
                )}

                {/* Signature line (shown on letterhead mode — compact) */}
                {hasLetterhead && (
                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '160px', height: '48px', borderBottom: '1px solid #333', marginBottom: '4px' }} />
                            <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>Signature & Cachet</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

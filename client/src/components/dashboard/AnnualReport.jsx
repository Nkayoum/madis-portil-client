import { useState, useRef, useEffect } from 'react';
import { Download, Table, PieChart, Calendar, TrendingUp, TrendingDown, DollarSign, Upload, Loader2, FileImage, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import FormalAnnualReport from './FormalAnnualReport';

export default function AnnualReport({ data, selectedYear, isAdmin }) {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();
    const [generating, setGenerating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [letterheadUrl, setLetterheadUrl] = useState(null);
    const BACKEND_URL = 'http://localhost:8000'; // Base URL for media files
    const reportRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load saved letterhead from user profile
    useEffect(() => {
        if (user?.letterhead) {
            // If it's a relative path starting with /media, prepend backend URL
            const url = user.letterhead.startsWith('http')
                ? user.letterhead
                : `${BACKEND_URL}${user.letterhead}`;
            setLetterheadUrl(url);
        } else {
            setLetterheadUrl(null);
        }
    }, [user?.letterhead]);

    if (!data) return null;

    const categories = data.category_stats || [];
    const rental = data.rental_performance || {};
    const trans = data.transactional_performance || {};

    const revenueCategories = categories.filter(c =>
        ['RENT', 'PROMOTION_SALE', 'CASH_CALL'].includes(c.category)
    );

    const expenseCategories = categories.filter(c =>
        !['RENT', 'PROMOTION_SALE', 'CASH_CALL'].includes(c.category)
    );

    const totalRevenue = revenueCategories.reduce((sum, c) => sum + c.total, 0);
    const totalExpense = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const netResult = totalRevenue - totalExpense;

    const handleLetterheadUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => setLetterheadUrl(ev.target.result);
        reader.readAsDataURL(file);

        // Upload to server
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('letterhead', file);
            const result = await updateUser(formData);
            if (!result.success) {
                console.error('Letterhead upload failed:', result.error);
                setLetterheadUrl(null); // Revert preview since upload failed
            }
        } catch (err) {
            console.error('Letterhead upload failed:', err);
            setLetterheadUrl(null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveLetterhead = async () => {
        setLetterheadUrl(null);
        setUploading(true);
        try {
            await updateUser({ letterhead: null });
        } catch (err) {
            console.error('Letterhead removal failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const generatePDF = async () => {
        if (!reportRef.current) return;
        setGenerating(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Step 1: If letterhead exists, add it directly to PDF at native resolution
            if (letterheadUrl) {
                // Load the original image at full quality
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = letterheadUrl;
                });

                // Determine format from the data URL or default to PNG
                let format = 'PNG';
                if (letterheadUrl.includes('image/jpeg') || letterheadUrl.includes('image/jpg')) {
                    format = 'JPEG';
                }

                // Add letterhead at full page size, native resolution
                pdf.addImage(img, format, 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            // Step 2: Capture only the financial content (without letterhead background)
            const canvas = await html2canvas(reportRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: letterheadUrl ? null : '#ffffff', // Transparent if letterhead
                logging: false,
                imageTimeout: 0,
            });

            const contentImgData = canvas.toDataURL('image/png');
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            // Overlay content on top of letterhead (or as standalone)
            let yOffset = 0;
            let pageNum = 0;
            while (yOffset < imgHeight) {
                if (pageNum > 0) {
                    pdf.addPage();
                    // Add letterhead to subsequent pages too
                    if (letterheadUrl) {
                        const img = new Image();
                        img.src = letterheadUrl;
                        let format = letterheadUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
                        pdf.addImage(img, format, 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                    }
                }
                pdf.addImage(contentImgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
                yOffset += pdfHeight;
                pageNum++;
            }

            pdf.save(`${t('annual_report.file_name_prefix')}${selectedYear}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <>
            {/* Professional Administrative Document (Print Only) */}
            {/* <FormalAnnualReport data={data} selectedYear={selectedYear} /> */}

            {/* Web UI Dashboard (Screen Only) */}
            <div className="space-y-8 animate-in fade-in duration-500 screen-only">
                {/* Header Summary */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="solaris-glass p-8 rounded-[2rem] border border-emerald-500/10 dark:border-emerald-500/20 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('annual_report.total_revenue')} {selectedYear}</span>
                        </div>
                        <div className="text-4xl font-black text-foreground tracking-tighter dark:text-white whitespace-nowrap">
                            <span className="hidden xl:inline">{formatCurrency(totalRevenue)}</span>
                            <span className="xl:hidden">{formatCurrency(totalRevenue, true)}</span>
                        </div>
                    </div>

                    <div className="solaris-glass p-8 rounded-[2rem] border border-rose-500/10 dark:border-rose-500/20 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-3">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('annual_report.total_expenses')} {selectedYear}</span>
                        </div>
                        <div className="text-4xl font-black text-foreground tracking-tighter dark:text-white whitespace-nowrap">
                            <span className="hidden xl:inline">{formatCurrency(totalExpense)}</span>
                            <span className="xl:hidden">{formatCurrency(totalExpense, true)}</span>
                        </div>
                    </div>

                    <div className={cn(
                        "solaris-glass p-8 rounded-[2rem] border group overflow-hidden relative",
                        netResult >= 0 ? "border-primary/10 dark:border-primary/20" : "border-orange-500/10 dark:border-orange-500/20"
                    )}>
                        <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-2xl transition-colors",
                            netResult >= 0 ? "bg-primary/5 group-hover:bg-primary/10" : "bg-orange-500/5 group-hover:bg-orange-500/10"
                        )} />
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className={cn("h-4 w-4", netResult >= 0 ? "text-primary" : "text-orange-500")} />
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest opacity-70",
                                netResult >= 0 ? "text-primary/70" : "text-orange-500/70"
                            )}>{t('annual_report.net_result')} {selectedYear}</span>
                        </div>
                        <div className={cn(
                            "text-4xl font-black tracking-tighter whitespace-nowrap",
                            netResult >= 0 ? "text-foreground dark:text-white" : "text-orange-600 dark:text-orange-400"
                        )}>
                            <span className="hidden xl:inline">{formatCurrency(netResult)}</span>
                            <span className="xl:hidden">{formatCurrency(netResult, true)}</span>
                        </div>
                    </div>
                </div>

                {/* Detailed Breakdown Table */}
                <div className="bg-card dark:bg-black/60 border dark:border-white/5 rounded-[2.5rem] overflow-hidden solaris-glass shadow-xl">
                    <div className="px-8 py-6 border-b dark:border-white/5 bg-muted/30 dark:bg-white/[0.02] flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Table className="h-4 w-4 text-primary" />
                            {t('annual_report.summary_category')} ({selectedYear})
                        </h3>
                        <div className="text-[10px] font-bold text-muted-foreground bg-background dark:bg-white/5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/10 uppercase tracking-widest">
                            {t('annual_report.total_consolidated')}
                        </div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/10 dark:bg-white/[0.02] border-b dark:border-white/5">
                                    <th className="px-6 py-3 text-left font-bold text-[10px] uppercase text-muted-foreground">{t('annual_report.th_category')}</th>
                                    <th className="px-6 py-3 text-right font-bold text-[10px] uppercase text-muted-foreground">{t('annual_report.th_amount')}</th>
                                    <th className="px-6 py-3 text-right font-bold text-[10px] uppercase text-muted-foreground">{t('annual_report.th_percent')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-white/5">
                                <tr className="bg-muted/5 dark:bg-white/[0.01]"><td colSpan="3" className="px-8 py-4 text-[10px] font-black uppercase text-emerald-600 tracking-widest">{t('annual_report.revenues_title')}</td></tr>
                                {revenueCategories.map(cat => (
                                    <tr key={cat.category} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-3 font-medium">{cat.label}</td>
                                        <td className="px-6 py-3 text-right font-black text-emerald-600">{cat.total.toLocaleString()}€</td>
                                        <td className="px-6 py-3 text-right text-muted-foreground text-xs font-bold">
                                            {totalRevenue > 0 ? ((cat.total / totalRevenue) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                                {revenueCategories.length === 0 && (
                                    <tr><td colSpan="3" className="px-6 py-4 text-center text-muted-foreground italic text-xs">{t('annual_report.no_revenues')}</td></tr>
                                )}

                                <tr className="bg-muted/5"><td colSpan="3" className="px-6 py-2 text-[10px] font-black uppercase text-rose-600 tracking-widest">{t('annual_report.expenses_title')}</td></tr>
                                {expenseCategories.map(cat => (
                                    <tr key={cat.category} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-3 font-medium">{cat.label}</td>
                                        <td className="px-6 py-3 text-right font-black text-rose-600">{cat.total.toLocaleString()}€</td>
                                        <td className="px-6 py-3 text-right text-muted-foreground text-xs font-bold">
                                            {totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                ))}
                                {expenseCategories.length === 0 && (
                                    <tr><td colSpan="3" className="px-6 py-4 text-center text-muted-foreground italic text-xs">{t('annual_report.no_expenses')}</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-muted/30 font-bold border-t-2 border-primary/20">
                                <tr>
                                    <td className="px-6 py-4 text-[11px] uppercase tracking-widest text-primary">{t('annual_report.net_annual_balance')}</td>
                                    <td className={cn(
                                        "px-6 py-4 text-right text-lg font-black whitespace-nowrap",
                                        netResult >= 0 ? "text-primary" : "text-rose-600"
                                    )}>
                                        <span className="hidden xl:inline">{formatCurrency(netResult)}</span>
                                        <span className="xl:hidden">{formatCurrency(netResult, true)}</span>
                                    </td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Note Section for Tax prep */}
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                    <h4 className="font-bold text-blue-800 dark:text-blue-400 text-sm mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('annual_report.tax_help_title')}
                    </h4>
                    <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
                        {t('annual_report.tax_help_text', { year: selectedYear })}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            onClick={generatePDF}
                            disabled={generating}
                            className="px-4 py-2 bg-white dark:bg-background border rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {generating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Download className="h-3 w-3" />
                            )}
                            {generating ? t('annual_report.btn_generating_pdf') : t('annual_report.btn_download_pdf')}
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                            className="hidden"
                            onChange={handleLetterheadUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 border rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 bg-white dark:bg-background"
                        >
                            {letterheadUrl ? <FileImage className="h-3 w-3 text-emerald-600" /> : <Upload className="h-3 w-3" />}
                            {letterheadUrl ? t('annual_report.btn_letterhead_loaded') : t('annual_report.btn_letterhead_upload')}
                        </button>

                        {letterheadUrl && (
                            <button
                                onClick={handleRemoveLetterhead}
                                disabled={uploading}
                                className="text-[10px] text-rose-500 hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
                            >
                                <Trash2 className="h-2.5 w-2.5" />
                                {t('annual_report.btn_letterhead_remove')}
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic mt-3">
                        {t('annual_report.note_depreciation')}
                    </p>
                </div>
            </div>

            {/* Hidden: Formal Report for PDF Capture */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <FormalAnnualReport
                    data={data}
                    selectedYear={selectedYear}
                    letterheadUrl={letterheadUrl}
                    reportRef={reportRef}
                />
            </div>
        </>
    );
}

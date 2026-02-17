import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { useJournalStore } from '../journal/store';

export const ExportService = {
    async generatePDF(): Promise<void> {
        const entries = useJournalStore.getState().entries;
        if (entries.length === 0) {
            alert('No entries to export.');
            return;
        }

        // Sort entries chronologically
        const sortedEntries = [...entries].sort((a, b) =>
            a.createdAtUTC - b.createdAtUTC
        );

        const pdfDoc = await PDFDocument.create();

        // Embed font - try to fetch Caveat, fallback to Helvetica
        let font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        try {
            const fontBytes = await fetch('https://fonts.gstatic.com/s/caveat/v17/Wnz6HAc5bAfYB2Q7ZjMd.woff2').then(res => res.arrayBuffer());
            font = await pdfDoc.embedFont(fontBytes);
        } catch (e) {
            console.warn('Could not load handwriting font, falling back to standard font.', e);
        }

        const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

        // Cover Page
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();

        page.drawText('My Personal Journal', {
            x: 50,
            y: height - 200,
            size: 40,
            font: titleFont,
            color: rgb(0.2, 0.2, 0.2),
        });

        page.drawText(`Exported on ${format(new Date(), 'PPP')}`, {
            x: 50,
            y: height - 260,
            size: 15,
            font: titleFont,
            color: rgb(0.5, 0.5, 0.5),
        });


        // Entries
        for (const entry of sortedEntries) {
            page = pdfDoc.addPage();

            const dateStr = format(new Date(entry.createdAtUTC), 'PPPP');

            // Date Header
            page.drawText(dateStr, {
                x: 50,
                y: height - 50,
                size: 18,
                font: titleFont,
                color: rgb(0.3, 0.3, 0.3),
            });

            // Title
            if (entry.title) {
                page.drawText(entry.title, {
                    x: 50,
                    y: height - 80,
                    size: 24,
                    font: font,
                    color: rgb(0.1, 0.1, 0.1),
                });
            }

            // Content (Basic word wrap)
            const fontSize = 14;
            const lineHeight = 20;
            const text = entry.content;
            const margin = 50;
            const maxWidth = width - (margin * 2);

            // Simple wrap logic
            const words = text.split(' ');
            let line = '';
            let y = height - 120;

            for (const word of words) {
                const testLine = line + word + ' ';
                const textWidth = font.widthOfTextAtSize(testLine, fontSize);

                if (textWidth > maxWidth) {
                    page.drawText(line, { x: margin, y, size: fontSize, font: font, color: rgb(0, 0, 0) });
                    line = word + ' ';
                    y -= lineHeight;

                    if (y < margin) {
                        page = pdfDoc.addPage();
                        y = height - margin;
                    }
                } else {
                    line = testLine;
                }
            }
            page.drawText(line, { x: margin, y, size: fontSize, font: font, color: rgb(0, 0, 0) });
        }

        const pdfBytes = await pdfDoc.save();

        // Download trigger
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `my-journal-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        link.click();
    }
};

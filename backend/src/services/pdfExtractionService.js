const fs = require('fs/promises');

let pdfjsModulePromise;

const loadPdfJs = async () => {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }

  return pdfjsModulePromise;
};

const normalizeTextItem = (value = '') =>
  String(value)
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const extractLinesFromItems = (items = []) => {
  const lines = [];
  let currentLine = '';
  let lastY = null;

  items.forEach((item) => {
    const text = normalizeTextItem(item?.str);
    if (!text) {
      return;
    }

    const y = Number(item?.transform?.[5] || 0);
    const hasLineBreak = lastY !== null && Math.abs(y - lastY) > 4;

    if (hasLineBreak && currentLine) {
      lines.push(currentLine.trim());
      currentLine = '';
    }

    currentLine = currentLine ? `${currentLine} ${text}` : text;
    lastY = y;

    if (item?.hasEOL && currentLine) {
      lines.push(currentLine.trim());
      currentLine = '';
      lastY = null;
    }
  });

  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines;
};

const extractTextFromPdf = async (filePath) => {
  const data = new Uint8Array(await fs.readFile(filePath));
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false
  });

  const pdfDocument = await loadingTask.promise;
  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lines = extractLinesFromItems(textContent.items);
      pages.push(lines.join('\n'));
    }
  } finally {
    await loadingTask.destroy();
  }

  return {
    pageCount: pdfDocument.numPages,
    text: pages
      .join('\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  };
};

module.exports = {
  extractTextFromPdf
};

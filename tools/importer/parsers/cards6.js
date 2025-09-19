/* global WebImporter */
export default function parse(element, { document }) {
  // Table header row as required: one cell only
  const headerRow = ['Cards (cards6)'];
  const rows = [headerRow];

  // Get all direct children (cards) of the grid
  const cardDivs = element.querySelectorAll(':scope > div');

  cardDivs.forEach((cardDiv) => {
    const img = cardDiv.querySelector('img');
    let textCell = '';
    // Collect all text nodes and elements inside the cardDiv (excluding the image)
    const textParts = [];
    cardDiv.childNodes.forEach((node) => {
      // Skip the image node
      if (node.nodeType === 1 && node.tagName === 'IMG') return;
      // If element node, get its text content
      if (node.nodeType === 1) {
        if (node.textContent.trim()) textParts.push(node.textContent.trim());
      }
      // If text node, get trimmed value
      if (node.nodeType === 3) {
        if (node.textContent.trim()) textParts.push(node.textContent.trim());
      }
    });
    if (img) {
      // Remove empty width/height attributes if present
      if (img.hasAttribute('width') && !img.getAttribute('width')) img.removeAttribute('width');
      if (img.hasAttribute('height') && !img.getAttribute('height')) img.removeAttribute('height');
      // Use alt text as the card title (in a heading)
      const cellContent = [];
      if (img.alt && img.alt.trim()) {
        const h3 = document.createElement('h3');
        h3.textContent = img.alt.trim();
        cellContent.push(h3);
      }
      // Add any other text found in the cardDiv
      if (textParts.length) {
        const p = document.createElement('p');
        p.textContent = textParts.join(' ');
        cellContent.push(p);
      }
      textCell = cellContent.length === 1 ? cellContent[0] : cellContent;
      rows.push([img, textCell]);
    }
  });

  // Create the table block
  const table = WebImporter.DOMUtils.createTable(rows, document);
  element.replaceWith(table);
}

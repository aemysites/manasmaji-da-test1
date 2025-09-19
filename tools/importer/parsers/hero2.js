/* global WebImporter */
export default function parse(element, { document }) {
  // Header row as required
  const headerRow = ['Hero (hero2)'];

  // --- Extract background image (row 2) ---
  // Find the first img in the hero section
  const bgImg = element.querySelector('img');
  let bgImgCell = '';
  if (bgImg) {
    bgImgCell = bgImg;
  }

  // --- Extract content (row 3) ---
  // Find the content card with heading, subheading, and CTAs
  let contentCell = '';
  // The card div contains all the text and CTAs
  const card = element.querySelector('.card');
  if (card) {
    // We'll collect the heading, subheading, and button group if present
    const contentParts = [];
    // Heading (h1)
    const h1 = card.querySelector('h1');
    if (h1) contentParts.push(h1);
    // Subheading (p)
    const subheading = card.querySelector('p');
    if (subheading) contentParts.push(subheading);
    // Button group (CTAs)
    const buttonGroup = card.querySelector('.button-group');
    if (buttonGroup) contentParts.push(buttonGroup);
    contentCell = contentParts;
  }

  // Compose the table rows
  const rows = [
    headerRow,
    [bgImgCell],
    [contentCell],
  ];

  // Create the block table
  const table = WebImporter.DOMUtils.createTable(rows, document);

  // Replace the original element with the new table
  element.replaceWith(table);
}

/* global WebImporter */
export default function parse(element, { document }) {
  // Table header row
  const headerRow = ['Hero (hero7)'];

  // --- Row 2: Background image (optional) ---
  // No image found in source HTML, so leave cell empty
  const bgImageRow = [''];

  // --- Row 3: Title, subheading, CTA ---
  // Find the main grid container (should be direct child)
  const grid = element.querySelector(':scope > .w-layout-grid');
  let titleEl = null;
  let subheadingEl = null;
  let ctaEl = null;

  if (grid) {
    // Title (h2)
    titleEl = grid.querySelector('h2');

    // Subheading and CTA are inside the second div
    const contentDiv = grid.querySelector('div');
    if (contentDiv) {
      // Subheading (paragraph)
      subheadingEl = contentDiv.querySelector('p');
      // CTA (link)
      ctaEl = contentDiv.querySelector('a');
    }
  }

  // Compose cell contents for row 3
  const cellContents = [];
  if (titleEl) cellContents.push(titleEl);
  if (subheadingEl) cellContents.push(subheadingEl);
  if (ctaEl) cellContents.push(ctaEl);

  const textRow = [cellContents];

  // Build table
  const cells = [
    headerRow,
    bgImageRow,
    textRow,
  ];

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}

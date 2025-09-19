/* global WebImporter */
export default function parse(element, { document }) {
  // Always use the target block name as the header row
  const headerRow = ['Columns block (columns5)'];

  // Get all immediate child divs (each is a column cell)
  const columnDivs = Array.from(element.querySelectorAll(':scope > div'));

  // For each column, extract its content (the image inside)
  const columns = columnDivs.map(div => {
    // Defensive: if the div contains an img, use it
    const img = div.querySelector('img');
    if (img) {
      return img;
    }
    // fallback: if no image, include the div itself
    return div;
  });

  // Build the table rows
  const rows = [
    headerRow,
    columns,
  ];

  // Create the block table
  const table = WebImporter.DOMUtils.createTable(rows, document);

  // Replace the original element with the new table
  element.replaceWith(table);
}

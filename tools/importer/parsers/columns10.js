/* global WebImporter */
export default function parse(element, { document }) {
  // Find the grid layout containing the columns
  const grid = element.querySelector('.grid-layout');
  if (!grid) return;
  // Get all direct children (the columns)
  const columns = Array.from(grid.children);
  // Defensive: Only keep columns with actual content
  const contentColumns = columns.filter(col => {
    // Remove columns that are empty or only whitespace
    return col && col.textContent.trim().length > 0;
  });
  // Table header row: Must match block name exactly
  const headerRow = ['Columns block (columns10)'];
  // Table second row: Each column's content as a cell (reference the actual element)
  const secondRow = contentColumns.map(col => col);
  // Build the table rows
  const rows = [headerRow, secondRow];
  // Create the block table
  const block = WebImporter.DOMUtils.createTable(rows, document);
  // Replace the original element with the table block
  element.replaceWith(block);
}

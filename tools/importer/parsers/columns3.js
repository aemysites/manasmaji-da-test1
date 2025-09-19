/* global WebImporter */
export default function parse(element, { document }) {
  // Header row as required
  const headerRow = ['Columns block (columns3)'];

  // Defensive: get the top-level grid (the one with the image sibling)
  const grid = element.querySelector('.grid-layout.container');
  // Defensive: get the left content column (text/buttons)
  let leftCol = null;
  if (grid) {
    leftCol = grid.querySelector(':scope > .section');
  }

  // Defensive: get the right image column (img is direct child of the outer grid)
  const rightImg = element.querySelector('img');

  // Build the left column cell content
  const leftCellContent = [];
  if (leftCol) {
    // Find heading, paragraph, and button group inside leftCol
    const heading = leftCol.querySelector('h2');
    if (heading) leftCellContent.push(heading);
    const richText = leftCol.querySelector('.rich-text');
    if (richText) leftCellContent.push(richText);
    const buttonGroup = leftCol.querySelector('.button-group');
    if (buttonGroup) leftCellContent.push(buttonGroup);
  }

  // Build the right column cell content
  const rightCellContent = rightImg ? [rightImg] : [];

  // Build the table rows
  const tableRows = [
    headerRow,
    [leftCellContent, rightCellContent]
  ];

  // Create the block table
  const block = WebImporter.DOMUtils.createTable(tableRows, document);

  // Replace the original element
  element.replaceWith(block);
}

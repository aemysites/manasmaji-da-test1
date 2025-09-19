/* global WebImporter */
export default function parse(element, { document }) {
  // Defensive: Find the grid layout container
  const grid = element.querySelector('.grid-layout');
  if (!grid) return;

  // Get all direct children of the grid
  const gridChildren = Array.from(grid.querySelectorAll(':scope > *'));

  // Find the left column (text block)
  let leftCol = null;
  let rightCol = null;

  // Find the first div (text block) and the ul (contact list)
  let textBlockDiv = null;
  let contactList = null;
  let image = null;

  gridChildren.forEach((child) => {
    if (child.tagName === 'DIV' && !textBlockDiv) {
      textBlockDiv = child;
    } else if (child.tagName === 'UL' && !contactList) {
      contactList = child;
    } else if (child.tagName === 'IMG' && !image) {
      image = child;
    }
  });

  // Compose left column: text block + contact list
  const leftColElements = [];
  if (textBlockDiv) leftColElements.push(textBlockDiv);
  if (contactList) leftColElements.push(contactList);

  // Compose right column: image
  const rightColElements = [];
  if (image) rightColElements.push(image);

  // Table header
  const headerRow = ['Columns block (columns9)'];

  // Table second row: two columns
  const secondRow = [leftColElements, rightColElements];

  // Build table
  const table = WebImporter.DOMUtils.createTable([
    headerRow,
    secondRow,
  ], document);

  // Replace original element
  element.replaceWith(table);
}

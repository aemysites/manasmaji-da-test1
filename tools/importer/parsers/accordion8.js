/* global WebImporter */
export default function parse(element, { document }) {
  // Always use the target block name as the header row
  const headerRow = ['Accordion (accordion8)'];
  const rows = [headerRow];

  // Defensive: get all immediate children that are dividers (each accordion item)
  const accordionItems = Array.from(element.querySelectorAll(':scope > .divider'));

  accordionItems.forEach((item) => {
    // Each .divider contains a grid-layout with two children: title and content
    const grid = item.querySelector('.grid-layout');
    if (!grid) return; // Defensive: skip if missing
    const children = Array.from(grid.children);
    // Find the title and content
    let titleEl = null;
    let contentEl = null;
    children.forEach((child) => {
      if (child.classList.contains('h4-heading')) {
        titleEl = child;
      } else if (child.classList.contains('rich-text') || child.classList.contains('w-richtext')) {
        contentEl = child;
      }
    });
    // Defensive: fallback if not found
    if (!titleEl) titleEl = children[0] || document.createElement('div');
    if (!contentEl) contentEl = children[1] || document.createElement('div');
    rows.push([titleEl, contentEl]);
  });

  // Create the block table
  const table = WebImporter.DOMUtils.createTable(rows, document);
  element.replaceWith(table);
}

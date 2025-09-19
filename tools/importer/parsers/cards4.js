/* global WebImporter */
export default function parse(element, { document }) {
  // Helper to extract card content from anchor blocks
  function extractCardContent(cardEl) {
    // Find image (first .utility-aspect-*) inside card
    const imgWrapper = cardEl.querySelector('.utility-aspect-1x1, .utility-aspect-3x2');
    let img = null;
    if (imgWrapper) {
      img = imgWrapper.querySelector('img');
    }
    // Find tag (optional)
    const tagGroup = cardEl.querySelector('.tag-group');
    let tag = null;
    if (tagGroup) {
      tag = tagGroup.querySelector('.tag');
    }
    // Find heading
    let heading = cardEl.querySelector('h3');
    // Find description
    let desc = cardEl.querySelector('p');
    // Compose text cell
    const textCell = document.createElement('div');
    if (tag) {
      const tagDiv = document.createElement('div');
      tagDiv.appendChild(tag.cloneNode(true));
      textCell.appendChild(tagDiv);
    }
    if (heading) {
      textCell.appendChild(heading.cloneNode(true));
    }
    if (desc) {
      textCell.appendChild(desc.cloneNode(true));
    }
    return [img, textCell];
  }

  // Get grid-layout
  const grid = element.querySelector('.grid-layout');
  if (!grid) return;

  // Get all direct children of grid-layout
  const gridChildren = Array.from(grid.children);

  // First card (large left card)
  let cards = [];
  const firstCard = gridChildren.find((el) => el.tagName === 'A');
  if (firstCard) {
    cards.push(extractCardContent(firstCard));
  }

  // Second row: two cards in flex-horizontal (right top)
  const flexTop = gridChildren.find((el) => el.classList.contains('flex-horizontal'));
  if (flexTop) {
    // Only get anchor children (cards)
    const topCards = Array.from(flexTop.querySelectorAll(':scope > a'));
    topCards.forEach((a) => {
      cards.push(extractCardContent(a));
    });
  }

  // Third row: multiple cards in flex-horizontal (right bottom)
  const flexBottom = gridChildren.find((el) => el.classList.contains('flex-horizontal') && el !== flexTop);
  if (flexBottom) {
    // Only get anchor children (cards)
    const bottomCards = Array.from(flexBottom.querySelectorAll(':scope > a'));
    bottomCards.forEach((a) => {
      // These cards have only heading and description, no image or tag
      let heading = a.querySelector('h3');
      let desc = a.querySelector('p');
      const textCell = document.createElement('div');
      if (heading) textCell.appendChild(heading.cloneNode(true));
      if (desc) textCell.appendChild(desc.cloneNode(true));
      cards.push([null, textCell]);
    });
  }

  // Compose table rows
  const headerRow = ['Cards (cards4)'];
  const rows = [headerRow];
  cards.forEach(([img, textCell]) => {
    rows.push([
      img ? img : '',
      textCell
    ]);
  });

  // Create table and replace element
  const block = WebImporter.DOMUtils.createTable(rows, document);
  element.replaceWith(block);
}

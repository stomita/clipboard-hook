import Clipboard from '../../..';

const clipboard = new Clipboard();

const el = document.getElementById('container');
el.addEventListener('keydown', (e) => {
  const itemEl = e.target;
  clipboard.handleKeyDownEvent(e, itemEl);
});

clipboard.on('copy', (itemEl) => {
  var textData = itemEl.textContent;
  var data = { name: textData, color: itemEl.className };
  clipboard.set({ data, textData });
});

clipboard.on('delete', (itemEl) => {
  itemEl.parentNode.removeChild(itemEl);
});

clipboard.on('paste', ({ data, textData }, itemEl) => {
  var newItemEl = itemEl.cloneNode(true);
  if (data) {
    newItemEl.textContent = data.name;
    newItemEl.className = data.color;
  } else {
    newItemEl.textContent = textData;
    newItemEl.className = 'black';
  }
  itemEl.parentNode.insertBefore(newItemEl, itemEl.nextSibling);
});

import Clipboard from '../../..';

const clipboard = new Clipboard();

const el = document.getElementById('container');
el.addEventListener('keydown', (e) => {
  clipboard.handleKeyDownEvent(e, (e) => e.target);
});

clipboard.on('copy', (itemEl) => {
  var textData = itemEl.innerHTML;
  var data = { name: textData, color: itemEl.className };
  clipboard.set({ data, textData });
});

clipboard.on('delete', (itemEl) => {
  itemEl.parentNode.removeChild(itemEl);
});

clipboard.on('paste', ({ data, textData }, itemEl) => {
  var newItemEl = itemEl.cloneNode(true);
  if (data) {
    newItemEl.innerHTML = data.name;
    newItemEl.className = data.color;
  } else {
    newItemEl.innerHTML = textData;
    newItemEl.className = 'black';
  }
  itemEl.parentNode.insertBefore(newItemEl, itemEl.nextSibling);
});

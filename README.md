# Clipboard Hook

Adding a hook mechanism on OS native clipboard event (e.g. copy/cut/paste).

## Usage

```es6
import Clipboard from './clipboard';

const clipboard = new Clipboard();

const el = document.getElementById('container');
el.addEventListener('keydown', (e) => {
  // Pass the keydown event to detect OS native keyboard shortcut event
  clipboard.handleKeyDownEvent(e, (e) => e.target);
});

// Called when Ctrl(Command)+C or Ctrl(Command)+X key is pressed
clipboard.on('copy', (itemEl) => {
  // textData is a serialized expression of the copying data,
  // and which will be actually copied to OS clipboard.
  var textData = itemEl.textContent;
  var data = { name: textData, color: itemEl.className };
  // set structured data to be copied to clipboard for future clipboard access.
  // must be called synchronously inside of this handler.
  clipboard.set({ data, textData });
});

// Called when Ctrl(Command)+X or DEL key is pressed
clipboard.on('delete', (itemEl) => {
  itemEl.parentNode.removeChild(itemEl);
});

// Called when Ctrl(Command)+V key is pressed
clipboard.on('paste', ({ data, textData }, itemEl) => {
  var newItemEl = itemEl.cloneNode(true);
  if (data) {
    // if structured data is available, previous copy hook is working.
    newItemEl.textContent = data.name;
    newItemEl.className = data.color;
  } else {
    // if there is no structured data, OS clipboard value is directly pasted.
    // you can parse the textData value or ignore it.
    newItemEl.textContent = textData;
    newItemEl.className = 'black';
  }
  itemEl.parentNode.insertBefore(newItemEl, itemEl.nextSibling);
});
```

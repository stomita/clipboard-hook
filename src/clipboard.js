/* global: document */

export default class Clipboard {
  constructor(namespace = '', containerEl = document.body) {
    this.id = '_clipboard_fake_' + namespace;
    this.containerEl = containerEl;
    this.doc = containerEl.ownerDocument;
  }

  findClipboardElement() {
    const containerEl = this.containerEl;
    let clipboardEl = containerEl.getElementById(this.id);
    if (!clipboardEl) {
      clipboardEl = this.doc.createElement('textarea');
      clipboardEl.style.position = 'absolute';
      clipboardEl.style.width = clipboardEl.style.height = 0;
      clipboardEl.style.top = clipboardEl.style.left = '-10000px';
      clipboardEl.style.opacity = 0;
      containerEl.appendChild(clipboardEl);
    }
    return clipboardEl;
  }

  save(data, textData, callback) {
    const clipboardEl = this.findClipboardElement();
    this.data = data;
    clipboardEl.value = textData;
    const activeEl = doc.activeElement;
    clipboardEl.focus();
    clipboardEl.select();
    setTimeout(() => {
      if (activeEl) { activeEl.focus(); }
      callback();
    }, 100);
  }

  get() {
    const clipboardEl = this.findClipboardElement();
    return { data: this.data, textData: clipboardEl.value };
  }

  load(callback) {
    const clipboardEl = this.findClipboardElement();
    const lastTextData = clipboardEl.value;
    setTimeout(() => {
      const textData = clipboardEl.value;
      const data = lastTextData === textData ? this.data : undefined;
      callback(null, { data, textData });
    }, 100);
  }

}

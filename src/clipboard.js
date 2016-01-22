/* global: document */
import { EventEmitter } from 'events';

export const KEY_X = 88;
export const KEY_C = 67;
export const KEY_V = 86;
export const KEY_DEL = 46;

export default class Clipboard extends EventEmitter {
  constructor(namespace = '', containerEl = document.body) {
    super();
    this.id = '_clipboard_fake_' + namespace;
    this.containerEl = containerEl;
    this.doc = containerEl.ownerDocument;
  }

  findClipboardElement() {
    const containerEl = this.containerEl;
    let clipboardEl = this.doc.getElementById(this.id);
    if (!clipboardEl) {
      clipboardEl = this.doc.createElement('textarea');
      clipboardEl.id = this.id;
      clipboardEl.style.position = 'absolute';
      clipboardEl.style.width = clipboardEl.style.height = 0;
      clipboardEl.style.top = clipboardEl.style.left = '-10000px';
      clipboardEl.style.opacity = 0;
      containerEl.appendChild(clipboardEl);
    }
    return clipboardEl;
  }

  get() {
    const clipboardEl = this.findClipboardElement();
    return { data: this.data, textData: clipboardEl.value };
  }

  set({ data, textData }) {
    this.data = data;
    const clipboardEl = this.findClipboardElement();
    clipboardEl.value = textData;
  }

  _save(callback) {
    const activeEl = this.doc.activeElement;
    const clipboardEl = this.findClipboardElement();
    const lastTextData = clipboardEl.value;
    clipboardEl.focus();
    clipboardEl.select();
    setTimeout(() => {
      clipboardEl.value = lastTextData;
      if (activeEl) { activeEl.focus(); }
      if (callback) { callback(); }
    }, 100);
  }

  _load(callback) {
    const activeEl = this.doc.activeElement;
    const clipboardEl = this.findClipboardElement();
    const lastTextData = clipboardEl.value;
    clipboardEl.focus();
    clipboardEl.select();
    setTimeout(() => {
      if (activeEl) { activeEl.focus(); }
      const { data: currentData, textData } = this.get();
      const data = lastTextData === textData ? currentData : undefined;
      const value = { data, textData };
      this.set(value);
      if (callback) { callback(null, value) }
    }, 100);
  }

  handleKeyDownEvent(e, context) {
    if (e.ctrlKey || e.metaKey) {
      const keyCode = e.keyCode;
      switch(keyCode) {
        case KEY_C:
        case KEY_X:
          context = typeof context === 'function' ? context(e) : context;
          this.emit('copy', context);
          this._save((err) => {
            if (err) {
              this.emit('error', err);
            } else {
              if (keyCode === KEY_X) {
                this.emit('delete', context);
              }
            }
          });
          break;
        case KEY_V:
          context = typeof context === 'function' ? context(e) : context;
          this._load((err, value) => {
            if (err) { this.emit('error', err); }
            else { this.emit('paste', value, context); }
          });
          break;
        case KEY_DEL:
          context = typeof context === 'function' ? context(e) : context;
          this.emit('delete', context);
          break;
        default:
          break;
      }
    }
  }

}

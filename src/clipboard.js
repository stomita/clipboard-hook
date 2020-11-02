/* global: document */
import { EventEmitter } from 'events';

const KEY_X = 88;
const KEY_C = 67;
const KEY_V = 86;
const KEY_DEL = 46;
const KEY_BACKSPACE = 8;

const CLIP_EVENT_DELAY_MSEC = 100;

export default class Clipboard extends EventEmitter {
  constructor(namespace = '', containerEl = document.body) {
    super();
    this.id = '_clipboard_fake_' + namespace;
    this.containerEl = containerEl;
    this.doc = containerEl.ownerDocument;
    this.supportCopyCommand =
      this.doc.queryCommandSupported && this.doc.queryCommandSupported('copy');
  }

  findClipboardElement() {
    const containerEl = this.containerEl;
    let clipboardEl = this.doc.getElementById(this.id);
    if (!clipboardEl) {
      clipboardEl = this.doc.createElement('textarea');
      clipboardEl.id = this.id;
      clipboardEl.style.position = 'absolute';
      clipboardEl.style.width = clipboardEl.style.height = '0';
      clipboardEl.style.opacity = 0;
      containerEl.appendChild(clipboardEl);
    }
    clipboardEl.style.top = (this.containerEl.scrollTop + 8) + 'px';
    clipboardEl.style.left = (this.containerEl.scrollLeft + 8) + 'px';
    return clipboardEl;
  }

  get() {
    const clipboardEl = this.findClipboardElement();
    const textData = clipboardEl.value === "\t" ? "" : clipboardEl.value;
    return { data: this.data, textData };
  }

  set({ data, textData }) {
    if (textData === "") { textData = "\t"; }
    this.data = data;
    const clipboardEl = this.findClipboardElement();
    clipboardEl.value = textData;
  }

  _execCopy() {
    if (this.supportCopyCommand) {
      this.doc.execCommand('copy');
    }
  }

  _save(callback) {
    const activeEl = this.doc.activeElement;
    const clipboardEl = this.findClipboardElement();
    const lastTextData = clipboardEl.value === "\t" ? "" : clipboardEl.value;
    clipboardEl.focus();
    clipboardEl.select();
    this._execCopy(); // execute if command is possible. Otherwise OS handles the copy event.
    setTimeout(() => {
      clipboardEl.value = lastTextData;
      if (activeEl) { activeEl.focus(); }
      if (callback) { callback(); }
    }, CLIP_EVENT_DELAY_MSEC);
  }

  _load(callback) {
    const activeEl = this.doc.activeElement;
    const clipboardEl = this.findClipboardElement();
    const lastTextData = clipboardEl.value === "\t" ? "" : clipboardEl.value;
    clipboardEl.focus();
    clipboardEl.select();
    // it seems that Chrome browser may delay the focus if active element is referenced
    const newActiveEl = this.doc.activeElement;
    setTimeout(() => {
      if (activeEl) { activeEl.focus(); }
      const { data: currentData, textData } = this.get();
      const data = lastTextData === textData ? currentData : undefined;
      const value = { data, textData };
      this.set(value);
      if (callback) { callback(null, value) }
    }, CLIP_EVENT_DELAY_MSEC);
  }

  handleKeyDownEvent(e, context) {
    const keyCode = e.keyCode;
    const getContext = typeof context === 'function' ? context : () => context;
    let ctx;
    switch(keyCode) {
      case KEY_C:
      case KEY_X:
        if (e.ctrlKey || e.metaKey) {
          ctx = getContext(e);
          this.emit('copy', ctx);
          this._save((err) => {
            if (err) {
              this.emit('error', err);
            } else {
              if (keyCode === KEY_X) {
                this.emit('delete', ctx);
              }
            }
          });
        }
        break;
      case KEY_V:
        if (e.ctrlKey || e.metaKey) {
          ctx = getContext(e);
          this._load((err, value) => {
            if (err) { this.emit('error', err); }
            else { this.emit('paste', value, ctx); }
          });
        }
        break;
      case KEY_DEL:
      case KEY_BACKSPACE:
        if (this.listeners('delete').length > 0) {
          e.preventDefault();
          e.stopPropagation();
          ctx = getContext(e);
          this.emit('delete', ctx);
        }
        break;
      default:
        break;
    }
  }

}

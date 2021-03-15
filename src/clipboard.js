/* global: document */
import { EventEmitter } from 'events';

const KEY_X = 88;
const KEY_C = 67;
const KEY_V = 86;
const KEY_DEL = 46;
const KEY_BACKSPACE = 8;

const CLIP_EVENT_DELAY_MSEC = 100;

export default class Clipboard extends EventEmitter {
  constructor(namespace = '', containerEl = document.body, options = {}) {
    super();
    this.id = '_clipboard_fake_' + namespace;
    this.containerEl = containerEl;
    this.doc = containerEl.ownerDocument;
    this.supportCopyCommand =
      this.doc.queryCommandSupported && this.doc.queryCommandSupported('copy');
    this.useNativeClipboardEvent = options.useNativeClipboardEvent;
  }

  listenEvents(el, context) {
    el.addEventListener('keydown', (e) => this.handleKeyDownEvent(e, context));
    if (this.useNativeClipboardEvent) {
      el.addEventListener('cut', (e) => this.handleClipboardCutEvent(e, context));
      el.addEventListener('copy', (e) => this.handleClipboardCopyEvent(e, context));
      el.addEventListener('paste', (e) => this.handleClipboardPasteEvent(e, context));
    }
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

  _save(e, callback) {
    if (e.type === 'keydown') {
      this._saveInKeydownEvent(callback);
    } else {
      this._saveInCopyEvent(e, callback);
    }
  }

  _saveInKeydownEvent(callback) {
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

  _saveInCopyEvent(e, callback) {
    const clipboardEl = this.findClipboardElement();
    const lastTextData = clipboardEl.value === "\t" ? "" : clipboardEl.value;
    const copyingText = clipboardEl.value;
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', copyingText);
    } else if (window.clipboardData) {
      window.clipboardData.setData('Text', copyingText);
    }
    e.preventDefault();
    setTimeout(() => {
      clipboardEl.value = lastTextData;
      if (callback) { callback(); }
    }, CLIP_EVENT_DELAY_MSEC);
  }

  _load(e, callback) {
    if (e.type === 'keydown') {
      this._loadInKeydownEvent(callback);
    } else {
      this._loadInPasteEvent(e, callback);
    }
  }

  _loadInKeydownEvent(callback) {
    const activeEl = this.doc.activeElement;
    const clipboardEl = this.findClipboardElement();
    const lastTextData = clipboardEl.value === "\t" ? "" : clipboardEl.value;
    clipboardEl.focus();
    clipboardEl.select();
    // it seems that Chrome browser may delay the focus if active element is referenced
    const newActiveEl = this.doc.activeElement;
    // following logic should be always false
    // this is intended in order to prevent the activeElement reference code being removed by the code optimization
    if (newActiveEl !== clipboardEl) {
      clipboardEl.focus();
    }
    setTimeout(() => {
      if (activeEl) { activeEl.focus(); }
      const { data: currentData, textData } = this.get();
      const data = lastTextData === textData ? currentData : undefined;
      const value = { data, textData };
      this.set(value);
      if (callback) { callback(null, value) }
    }, CLIP_EVENT_DELAY_MSEC);
  }

  _loadInPasteEvent(e, callback) {
    const clipboardEl = this.findClipboardElement();
    const lastTextData = clipboardEl.value === "\t" ? "" : clipboardEl.value;
    let pastingText = lastTextData;
    if (e.clipboardData) {
      pastingText = e.clipboardData.getData('text/plain');
    } else if (window.clipboardData) {
      pastingText = window.clipboardData.getData('Text');
    }
    e.preventDefault();
    clipboardEl.value = pastingText;
    setTimeout(() => {
      const { data: currentData, textData } = this.get();
      const data = lastTextData === textData ? currentData : undefined;
      const value = { data, textData };
      this.set(value);
      if (callback) { callback(null, value) }
    }, CLIP_EVENT_DELAY_MSEC);
  }

  handleClipboardCutEvent(e, context) {
    this.handleClipboardCopyEvent(e, context, true);
  }

  handleClipboardCopyEvent(e, context, isCut = false) {
    const getContext = typeof context === 'function' ? context : () => context;
    const ctx = getContext(e);
    this.emit('copy', ctx);
    this._save(e, (err) => {
      if (err) {
        this.emit('error', err);
      } else {
        if (isCut) {
          this.emit('delete', ctx);
        }
      }
    });
  }

  handleClipboardPasteEvent(e, context) {
    const getContext = typeof context === 'function' ? context : () => context;
    const ctx = getContext(e);
    this._load(e, (err, value) => {
      if (err) { this.emit('error', err); }
      else { this.emit('paste', value, ctx); }
    });
  }

  handleDeleteEvent(e, context) {
    const getContext = typeof context === 'function' ? context : () => context;
    if (this.listeners('delete').length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const ctx = getContext(e);
      this.emit('delete', ctx);
    }
  }

  handleKeyDownEvent(e, context) {
    const keyCode = e.keyCode;
    switch(keyCode) {
      case KEY_C:
      case KEY_X:
        if (e.ctrlKey || e.metaKey) {
          if (!this.useNativeClipboardEvent) {
            this.handleClipboardCopyEvent(e, context, keyCode === KEY_X);
          }
        }
        break;
      case KEY_V:
        if (e.ctrlKey || e.metaKey) {
          if (!this.useNativeClipboardEvent) {
            this.handleClipboardPasteEvent(e, context);
          }
        }
        break;
      case KEY_DEL:
      case KEY_BACKSPACE:
        this.handleDeleteEvent(e, context);
        break;
      default:
        break;
    }
  }

}

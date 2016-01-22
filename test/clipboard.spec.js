import assert from 'power-assert';
import Clipboard from '..';

import server from './server/server';

const { Key } = protractor;

describe('clipboard', function() {
  this.timeout(20000);

  before((done) => {
    server.listen(done);
  });

  const OP_INTERVAL = 100;

  it('should copy an item to clipboard', async () => {
    await browser.get('/');
    let count = await $$('#container .blue').count();
    assert(count === 1);
    const item = $$('#container .blue').first();
    const text = await item.getText();
    await item.click();
    await item.sendKeys(Key.chord(Key.CONTROL, 'c'));
    await browser.sleep(OP_INTERVAL);
    const textbin = $('#textbin');
    await textbin.clear();
    await textbin.sendKeys(Key.chord(Key.CONTROL, 'v'));
    await browser.sleep(OP_INTERVAL);
    const copiedText = await textbin.getAttribute('value');
    assert(text === copiedText);
  });

  it('should paste item from clipboard', async () => {
    await browser.get('/');
    let count = await $$('#container .black').count();
    assert(count === 0);
    const textbin = $('#textbin');
    await textbin.sendKeys('Diamond', Key.chord(Key.CONTROL, 'a'), Key.chord(Key.CONTROL, 'c'));
    await browser.sleep(OP_INTERVAL);
    const item = $$('#container *').first();
    await item.click();
    await item.sendKeys(Key.chord(Key.CONTROL, 'v'));
    await browser.sleep(OP_INTERVAL);
    count = await $$('#container .black').count();
    assert(count === 1);
    const text = await $('#container .black').getText();
    assert(text === 'Diamond');
  });

  it('should copy an item and paste it', async () => {
    await browser.get('/');
    let count = await $$('#container .red').count();
    assert(count === 1);
    const item = $$('#container .red').first();
    await item.click();
    await item.sendKeys(Key.chord(Key.CONTROL, 'c'));
    await browser.sleep(OP_INTERVAL);
    await item.sendKeys(Key.chord(Key.CONTROL, 'v'));
    await browser.sleep(OP_INTERVAL);
    count = await $$('#container .red').count();
    assert(count === 2);
  });

  it('should cut an item', async () => {
    await browser.get('/');
    let count = await $$('#container .red').count();
    assert(count === 1);
    let item = $$('#container .red').first();
    await item.click();
    await item.sendKeys(Key.chord(Key.CONTROL, 'x'));
    await browser.sleep(OP_INTERVAL);
    count = await $$('#container .red').count();
    assert(count === 0);
    item = $$('#container *').first();
    await item.sendKeys(Key.chord(Key.CONTROL, 'v'));
    await browser.sleep(OP_INTERVAL);
    count = await $$('#container .red').count();
    assert(count === 1);
  });

  it('should delete an item', async () => {
    await browser.get('/');
    let count = await $$('#container .blue').count();
    assert(count === 1);
    let item = $$('#container .blue').first();
    await item.click();
    await item.sendKeys(Key.DELETE);
    await browser.sleep(OP_INTERVAL);
    count = await $$('#container .blue').count();
    assert(count === 0);
  });

  after(() => {
    server.close();
  });
});

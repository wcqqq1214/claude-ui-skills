"use strict";
// Bundled glyph map; UI placement is limited to existing demos.
const DemoIcons = (() => {
  const glyphs = {"Add":57345,"ArrowUp":57363,"ArrowDown":57353,"ArrowLeft":57356,"ArrowRight":57360,"ArrowClockwise":57629,"X":57615,"Expand":57447,"Eye":57449,"Collapse":57421,"ArrowUpRight":57365,"File":57452,"Code":57416,"Chat":57393,"Tasks":57585,"Check":57403,"Copy":57430,"CaretDown":57383,"Chats":57401,"Info":57487,"DotsVertical":57442,"DotsHorizontal":57441};
  const strokes = {12:.8,16:1,20:1.2,24:1.4,28:1.6,32:1.8};
  function create(name, size=16) {
    if (!(size in strokes)) throw new Error('Unknown demo icon size');
    if (!(name in glyphs)) throw new Error('Unknown demo icon');
    const master = size <= 18 ? 16 : 20, lo = master === 16 ? .8 : 1.125, hi = master === 16 ? 1.25 : 1.8;
    const weight = Math.round(Math.max(400, Math.min(700, 400 + 300 * (strokes[size]*master/size-lo)/(hi-lo)))*10)/10;
    const icon = document.createElement('span');
    icon.className = 'study-icon'; icon.setAttribute('aria-hidden','true'); icon.dataset.glyph = name;
    icon.style.fontSize = size+'px'; icon.style.setProperty('--icon-weight',weight);
    icon.textContent = String.fromCodePoint(glyphs[name]);
    return icon;
  }
  document.querySelectorAll('[data-ui-icon]').forEach(host => host.replaceChildren(create(host.dataset.uiIcon, Number(host.dataset.iconSize)||16)));
  return {create};
})();

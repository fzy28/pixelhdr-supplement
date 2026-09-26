'use strict';
window.SUPPLEMENT_ASSET_BASE = "https://huggingface.co/datasets/pixelhdr-review/website_assets/resolve/main/";
window.supplementAssetUrl = function(path, download = false) {
  const url = window.SUPPLEMENT_ASSET_BASE + path;
  return download && window.SUPPLEMENT_ASSET_BASE ? url + '?download=true' : url;
};
window.supplementReplaceHash = function(hash) {
  try { history.replaceState(null, '', hash); }
  catch (_error) { /* Anonymous viewer sandboxes can forbid history updates. */ }
};

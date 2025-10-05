(function() {
  if (document.location.hash.indexOf('invite_token') > -1) {
    document.location.pathname = '/admin/';
  }
})();

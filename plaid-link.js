var linkHandler = Plaid.create({
  env: 'tartan',
  clientName: 'Ink.',
  key: 'a05be3540f330291f9677aecb315fe',
  product: 'auth',
  // To use Link with longtail institutions on Connect, set the
  // 'longTail' option to true:
  // longTail: true,
  onLoad: function() {
    // The Link module finished loading.
  },
  onSuccess: function(public_token, metadata) {
    // Send the public_token to your app server here.
    // The metadata object contains info about the institution the
    // user selected and the account ID, if selectAccount is enabled.
      console.log(public_token);
      console.log(metadata);
  },
  onExit: function() {
    // The user exited the Link flow.
  }
});

// Trigger the standard institution select view
document.getElementById('linkButton').onclick = function() {
  linkHandler.open();
};
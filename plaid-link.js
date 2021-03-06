var linkHandler = Plaid.create({
    selectAccount: true,
    env: 'tartan',
    clientName: 'Ink.',
    key: 'f2f9cc021ab55c080a2b73ab5f5a13',
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
        addedPlaid(public_token, metadata.account_id);
    },
    onExit: function() {
        // The user exited the Link flow.
    }
});

// Trigger the standard institution select view
document.getElementById('linkButton').onclick = function() {
    linkHandler.open();
};
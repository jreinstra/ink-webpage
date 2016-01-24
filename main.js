//check if user id, auth key, & account status exists
// if not exists, login with fb-api => display panes appropriately
// if exists, check if bank connection => display panes appropriately
// after bank connection, query general info


var BASE_URL = "http://api.getink.co/";

var USER_ID_NAME = "userID";
var AUTH_TOKEN_NAME = "authToken";
var HAS_PLAID_NAME = "hasPlaidToken";

var MONTHS = {
    1:"January",
    2:"February",
    3:"March",
    4:"April",
    5:"May",
    6:"June",
    7:"July",
    8:"August",
    9:"September",
    10:"October",
    11:"November",
    12:"December"
};

var checking = 0;
var savings = 0;

function mainInit(fbResponse) {
    if(localStorage[USER_ID_NAME] && localStorage[AUTH_TOKEN_NAME]) {
        if(localStorage[HAS_PLAID_NAME] == 'false') {
            login(fbResponse);
        }
        else {
            initLoggedIn();
        }
    }
    else {
        if (fbResponse.status === 'connected') {
            // Logged into your app / Facebook.
            // send response.authResponse.accessToken to Jose & get user ID & account setup status
            // save user ID, API token and account setup status
            login(fbResponse);
        } else if (fbResponse.status === 'not_authorized') {
            // logged into Facebook but not app
            $("#paneLogin").show();
        } else {
            // not logged into Facebook
            $("#paneLogin").show();
        }
    }
}

function login(fbResponse) {
    $.post(BASE_URL + "user/login", {"fbToken":fbResponse.authResponse.accessToken}, function(r) {
        //console.log(r);
        localStorage[USER_ID_NAME] = r.id;
        localStorage[AUTH_TOKEN_NAME] = r.auth_token;
        localStorage[HAS_PLAID_NAME] = r.hasPLToken;

        initLoggedIn();
    });
}

function initLoggedIn() {
    $("#paneLogin").hide();
    
    if(localStorage[HAS_PLAID_NAME] == 'false') {
        $("#paneBankConnect").show();
    }
    else {
        // load user data
        $("#paneBankConnect").hide();
        loadMain();
    }
}

function addedPlaid(token, account_id) {
    console.log("id: " + account_id);
    apiPost("user/link", {"PLToken":token, "account_id":account_id}, function(r) {
        localStorage[HAS_PLAID_NAME] = true;
        initLoggedIn();
    });
}


function loadMain() {
    $("#tabBalance").resize(addGraph);
    
    loadBalances();
    loadTransactions();
    
    $("#saveSubmit").click(manualSave);
    setInterval(loadFeed, 60000);
}

function loadBalances() {
    apiGet("user/accounts", {}, function(r) {
        console.log(r);
        checking = r.accounts.checking.balance;// + 1324223;
        savings = r.accounts.savings.balance;// + 4398289;
        
        $("#balance").html("$" + addCommas((checking + savings).toFixed(2)));
        $("#checking").html("$" + addCommas(checking.toFixed(2)));
        $("#savings").html("$" + addCommas(savings.toFixed(2)));
        $("#paneMain").show();
        addGraph(checking, savings);
        loadFeed();
    });
}

function loadFeed() {
    apiGet("user/feed", {}, function(r) {
        $("#feedItems").html('');
        $("#feedItems").show();
        console.log(r);
        var items = r.feed;
        for(var i in items) {
            var item = items[i];
            if(item.penalty == true) {
                var color = "red";
            }
            else {
                var color = "green";
            }
            $("#feedItems").append(
                '<div><span class="lead ' + color + '">' + item.message + '</span><br>' +
                '<span class="pull-right">' + timeAgo(item.timestamp) + '</span></div><br>'
            );
        }
        
        if(items.length == 0) {
            $("#feedItems").html('<p class="lead green">No items yet!</p>');
        }
    });
}

function timeAgo(timestamp) {
    var current = Math.floor(Date.now() / 1000);
    var diff = current - timestamp;
    if(diff <= 60) {
        var num = diff;
        var quantity = "sec";
    }
    else if(diff <= 3600) {
        var num = Math.floor(diff / 60);
        var quantity = "min";
    }
    else if(diff <= 86400) {
        var num = Math.floor(diff / 3600);
        var quantity = "hour";
    }
    else {
        var num = Math.floor(diff / 86400);
        var quantity = "day";
    }
    
    if(num == 1) {
        return num + " " + quantity + " ago.";
    }
    else {
        return num + " " + quantity + "s ago.";
    }
}

function loadTransactions() {
    apiGet("user/transactions", {}, function(r) {
        console.log(r);
        var transactions = r.transactions;
        var lastDate = null;
        for(var i in transactions) {
            var t = transactions[i];
            if(t.date != lastDate) {
                lastDate = t.date;
                $("#transactionsList").append("<h3>" + dateFriendly(lastDate) + "</h3><hr>");
            }
            $("#transactionsList").append(
                '<div class="t-merchant pull-left">' + t.name.substring(0, 14) + '</div>' +
                '<div class="t-amount pull-right red">$' + t.amount.toFixed(2) + '</div><br><br>'
            );
            if(t.amount_saved > 0) {
                $("#transactionsList").append(
                    '<div class="pull-right green">Saved $' + t.amount_saved.toFixed(2) + '!</div><br><br>'
                );
            }
        }
    });
}

function manualSave(e) {
    var amount = parseInt($("#inputAmount").val());
    if(!isNaN(amount) && amount > 0 && amount < checking) {
        $("#saveAmount").html("$" + amount.toFixed(2));
        $("#saveForm").hide();
        $("#saveLoading").show();
        apiPost("user/transfer", {"amount":amount}, function(r) {
            console.log(r);
            $("#saveLoading").hide();
            if(r.success == true) {
                $("#saveMessage").show();
                setTimeout(function() {
                    $("#saveMessage").hide();
                    $("#saveForm").show();
                }, 3000);
                loadBalances();
            }
            else {
                $("#saveForm").show();
            }
        });
    }
    else {
        alert("You must enter a valid amount to save out of your unsaved money.");
    }
}

function dateFriendly(data) {
    return MONTHS[parseInt(data.substring(5, 7))] + " " + parseInt(data.substring(8));
}

function addCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function apiPost(method, params, success) {
    console.log("post " + method);
    
    params["token"] = localStorage[AUTH_TOKEN_NAME];
    $.post(BASE_URL + method, params, function(r) {
        if(r.success == true) {
            success(r);
        }
        else {
            console.log(r);
            alert(r.message.resolve);
        }
    });
}

function apiGet(method, params, success) {
    console.log("get " + method);
    
    params["token"] = localStorage[AUTH_TOKEN_NAME];
    $.get(BASE_URL + method, params, function(r) {
        if(r.success == true) {
            success(r);
        }
        else {
            console.log(r);
            alert(r.message.resolve);
        }
    });
}
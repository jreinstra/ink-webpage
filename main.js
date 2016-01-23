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

function addedPlaid(token) {
    console.log("token: " + token);
    apiPost("user/link", {"PLToken":token}, function(r) {
        localStorage[HAS_PLAID_NAME] = true;
        initLoggedIn();
    });
}


function loadMain() {
    $("#tabBalance").resize(addGraph);
    
    loadBalances();
    loadTransactions();
}

function loadBalances() {
    apiGet("user/accounts", {}, function(r) {
        console.log(r);
        checking = r.accounts.checking.balance;
        savings = r.accounts.savings.balance;
        
        $("#balance").html("$" + (checking + savings));
        $("#checking").html("$" + checking);
        $("#savings").html("$" + savings);
        $("#paneMain").show();
        addGraph(checking, savings);
    });
}

function loadTransactions() {
    apiGet("user/transactions", {}, function(r) {
        var transactions = r.transactions.transactions;
        var lastDate = null;
        for(var i in transactions) {
            var t = transactions[i];
            if(t.date != lastDate) {
                lastDate = t.date;
                $("#transactionsList").append("<h3>" + dateFriendly(lastDate) + "</h3><hr>");
            }
            $("#transactionsList").append(
                '<div class="t-merchant pull-left">' + t.name.substring(0, 14) + '</div>' +
                '<div class="t-amount pull-right red">$' + t.amount + '</div><br><br><div class="pull-right green">Saved $0.40</div><br><br>'
            );
        }
    });
}

function dateFriendly(data) {
    return MONTHS[parseInt(data.substring(5, 7))] + " " + parseInt(data.substring(8));
}


function apiPost(method, params, success) {
    params["token"] = localStorage[AUTH_TOKEN_NAME];
    $.post(BASE_URL + method, params, function(r) {
        if(r.success == true) {
            success(r);
        }
        else {
            alert(r.message);
        }
    });
}

function apiGet(method, params, success) {
    params["token"] = localStorage[AUTH_TOKEN_NAME];
    $.get(BASE_URL + method, params, function(r) {
        if(r.success == true) {
            success(r);
        }
        else {
            alert(r.message);
        }
    });
}
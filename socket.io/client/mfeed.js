$(document).ready(function () {
    const mfeed_domain = 'http://localhost:3000';
    $('body').append($(
        '<script src="' + mfeed_domain + '/socket.io/socket.io.js"></script>'
    ));
    // $('body').append($(
    //     '<script src="/socket.io/socket.io.js"></script>'
    // ));
    $('body').append($(
        '<script src="' + mfeed_domain + '/SportsWidget.js"></script>'
    ));

});
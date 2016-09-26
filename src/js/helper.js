var
    logs = require('./logs.js')
    , sort = require('./sort.js')
    ;

exportObj = {
    logs: logs
    , sort: function (o) {
        var
            sorted = {}
            , key, a = [];

        for (key in o) if (o.hasOwnProperty(key)) a.push(key);

        a.sort();

        for (key = 0; key < a.length; key++) sorted[a[key]] = o[a[key]];

        return sorted;
    }
}

exportObj.validate = function (data) {

    var len = data.accounts.length || data.items.length

    if (len == 0) this.logs.empty(data);
    else if (len == 1) return this.logs.entering(data)
    else this.logs.choose(data)
}

module.exports = exportObj;
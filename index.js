'use strict'

var declaring = require('./src/js/declaring.js');

declaring.start(__filename.split('\\').pop())

var
    google = require('googleapis')
    , P = require('bluebird')
    , helper = require('./src/js/helper.js')
    , key =
        /* 
        require('./client_secret.json')
        */
        require('./jsonFodao.json')
    , scopes = [
        'https://www.googleapis.com/auth/analytics.readonly'
        , 'https://www.googleapis.com/auth/tagmanager.readonly'
        , 'https://www.googleapis.com/auth/tagmanager.manage.accounts'
    ]
    ;

var
    OAuth2Client = google.auth.OAuth2
    , jwtClient = new google.auth.JWT(
        key.client_email
        , null
        , key.private_key
        , scopes
        , null
    )
    ;

var
    oauth2Client = new OAuth2Client(
        key.client_id
        , key.client_secret
        , key.redirect_uris
    )
    , app = require('./src/js/app.js')
    ;


var
    metrics = ['ga:totalEvents']
    , dimensions = [
        'ga:eventCategory'
        , 'ga:eventAction'
        , 'ga:date'
    ], query = {
        //TODO: change with consent screen?
        //        auth: jwtClient
        'start-date': '2016-08-01'
        , 'end-date': '2016-09-01'
        , metrics: metrics.join(', ')
        , dimensions: dimensions.join(', ')
        , ids: ''
    }
    , retDateObj = strDate => {
        var d = strDate.split('-');
        return new Date(
            d[0]
            , d[1]
            , d[2]
        )
    }
    , dateObj = () => {
        var obj = {
            s: retDateObj(query['start-date'])
            , e: retDateObj(query['end-date'])
        };

        obj.len = ((obj.e - obj.s) / 1000 / 60 / 60 / 24);

        return obj;
    }
    ;

app.GA.events(jwtClient, query, 1, 0, 0).then(function (events) {

    var
        array = []
        , len = 0
        , one = 0
        , other = 0
        ;

    events.rows.forEach(function (element, i) {
        array.push('s')

        console.log(array)
        console.log('array[i]')
        console.log(array[i])

        console.log('element[0]')
        console.log(element[0])

        var newEvent = (
            array[i].indexOf(element[0]) == -1
            &&
            array.indexOf(element[1]) == -1
        )
            ;

        if (newEvent) {

            array.push(element)
            len = array.length - 1


            array[len].push(1)
            one++

        } else {
            len = array.length - 1

            array[len][4]++
            other++
        }

        //    console.log(element)
        //  console.log(element[4])

        console.log(array)

    })
    console.log('in if', one)
    console.log('in else', other)


});


declaring.end()